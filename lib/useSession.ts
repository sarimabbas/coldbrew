import { useAtom, useAtomValue, useSetAtom } from "jotai";
import { useEffect } from "react";
import { atomWithStorage, createJSONStorage } from "jotai/utils";
import { trpc } from "./trpc";
import { Cask } from "@prisma/client";
import { useMemo, useCallback } from "react";
import { useTrackParallelMutations } from "./useTrackParallelMutations";
import Router, { useRouter } from "next/router";

// ----- SESSION STORAGE

const sessionStorageAdapter = createJSONStorage<string>(() => sessionStorage);
export const sessionIdentifierAtom = atomWithStorage<string>(
  "coldbrewSessionId",
  "",
  sessionStorageAdapter
);
export const sessionAccessTokenAtom = atomWithStorage<string>(
  "coldbrewSessionAccessToken",
  "",
  sessionStorageAdapter
);

// -----

const createEmptyCask = (): Cask => ({
  id: Math.random.toString(),
  updatedAt: new Date(),
  createdAt: new Date(),
  name: "",
  homepage: "",
  logoUrl: "",
  ranking: 0,
  installCount: "",
  installPercent: "",
});

export const useCreateSession = () => {
  const { invalidateQueries } = trpc.useContext();

  const [sessionIdentifier, setSessionIdentifier] = useAtom(
    sessionIdentifierAtom
  );
  const [sessionAccessToken, setSessionAccessToken] = useAtom(
    sessionAccessTokenAtom
  );

  // create new session if it does not exist yet

  const { mutate } = trpc.useMutation("createNewSession", {
    onSuccess: (data) => {
      setSessionIdentifier(data.id);
      setSessionAccessToken(data.accessToken ?? "");
    },
  });

  const createSessionCallback = useCallback(async () => {
    if (!sessionIdentifier) {
      mutate(null);
    }
  }, [sessionIdentifier, mutate]);

  useEffect(() => {
    createSessionCallback();
  }, [createSessionCallback]);

  // copy casks between sessions

  const router = useRouter();
  const sessionQueryParam = Array.isArray(router.query["session"])
    ? router.query["session"]?.[0]
    : router.query["session"];

  const { mutate: copyCasksMutation } = trpc.useMutation(
    "copyCasksBetweenSessions",
    {
      onSettled: async () => {
        await invalidateQueries("getSession");
        Router.push("/", undefined, { shallow: true });
      },
    }
  );

  const copyCasksCallback = useCallback(async () => {
    if (sessionIdentifier && sessionQueryParam && sessionAccessToken) {
      copyCasksMutation({
        sourceSessionId: sessionQueryParam,
        destinationSessionId: sessionIdentifier,
        destinationSessionAccessToken: sessionAccessToken,
      });
    }
  }, [
    sessionIdentifier,
    sessionQueryParam,
    sessionAccessToken,
    copyCasksMutation,
  ]);

  useEffect(() => {
    copyCasksCallback();
  }, [copyCasksCallback]);
};

export const useSession = () => {
  const sessionIdentifier = useAtomValue(sessionIdentifierAtom);
  const sessionAccessToken = useAtomValue(sessionAccessTokenAtom);

  const mutationTracker = useTrackParallelMutations();

  // -------- TRPC

  const { getQueryData, setQueryData, invalidateQueries, queryClient } =
    trpc.useContext();

  const {
    data: session,
    isLoading,
    refetch,
  } = trpc.useQuery(["getSession", { sessionId: sessionIdentifier }]);

  const addCaskToSessionMutation = trpc.useMutation("addCaskToSession", {
    onMutate: async ({ sessionId, caskId }) => {
      mutationTracker.startOne();
      await queryClient.cancelQueries();
      const previousSession = getQueryData(["getSession", { sessionId }]);
      if (previousSession) {
        setQueryData(["getSession", { sessionId }], {
          ...previousSession,
          casks: [
            ...previousSession.casks,
            {
              ...createEmptyCask(),
              id: caskId,
            },
          ],
        });
      }
      return { previousSession };
    },
    onError: (err, variables, ctx) => {
      console.error(err);
      if (ctx?.previousSession) {
        setQueryData(
          ["getSession", { sessionId: variables.sessionId }],
          ctx.previousSession
        );
      }
    },
    onSettled: () => {
      mutationTracker.endOne();
      if (mutationTracker.allEnded()) {
        invalidateQueries("getSession");
      }
    },
  });

  const removeCaskFromSessionMutation = trpc.useMutation(
    "removeCaskFromSession",
    {
      onMutate: async ({ caskId, sessionId }) => {
        mutationTracker.startOne();
        await queryClient.cancelQueries();
        const previousSession = getQueryData(["getSession", { sessionId }]);
        if (previousSession) {
          setQueryData(["getSession", { sessionId }], {
            ...previousSession,
            casks: [
              ...previousSession.casks.filter((c) => c.id !== caskId),
              // .map((c) => ({ ...c })),
            ],
          });
        }
        return { previousSession };
      },
      onError: (err, variables, ctx) => {
        console.error(err);
        if (ctx?.previousSession) {
          setQueryData(
            ["getSession", { sessionId: variables.sessionId }],
            ctx.previousSession
          );
        }
      },
      onSettled: () => {
        mutationTracker.endOne();
        if (mutationTracker.allEnded()) {
          invalidateQueries("getSession");
        }
      },
    }
  );

  // -------- CASKS

  const casks = useMemo(() => session?.casks ?? [], [session]);

  const toggleSelectedCask = useCallback(
    async (cask: Cask) => {
      if (!session?.id) {
        return null;
      }
      if (casks.find((c) => c.id === cask.id)) {
        return removeCaskFromSessionMutation.mutate({
          sessionId: session.id,
          caskId: cask.id,
          accessToken: sessionAccessToken,
        });
      } else {
        return addCaskToSessionMutation.mutate({
          sessionId: session.id,
          caskId: cask.id,
          accessToken: sessionAccessToken,
        });
      }
    },
    [
      addCaskToSessionMutation,
      removeCaskFromSessionMutation,
      casks,
      session?.id,
      sessionAccessToken,
    ]
  );

  const isCaskSelected = useCallback(
    (cask: Cask) => {
      return !!casks.find((c) => c.id === cask.id);
    },
    [casks]
  );

  return {
    isLoading:
      isLoading ||
      addCaskToSessionMutation.isLoading ||
      removeCaskFromSessionMutation.isLoading,
    session,
    casks,
    toggleSelectedCask,
    isCaskSelected,
    refetch,
  };
};
