import { useAtom, useAtomValue } from "jotai";
import { useEffect } from "react";
import { sessionIdentifierAtom } from "./store";
import { trpc } from "./trpc";
import { Cask } from "@prisma/client";
import { useMemo, useCallback } from "react";
import { useTrackParallelMutations } from "./useTrackParallelMutations";

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
  const [sessionIdentifier, setSessionIdentifier] = useAtom(
    sessionIdentifierAtom
  );
  const { mutate } = trpc.useMutation("createNewSession", {
    onSuccess: (data) => {
      setSessionIdentifier(data.id);
    },
  });

  useEffect(() => {
    if (!sessionIdentifier) {
      mutate();
    }
  }, [sessionIdentifier, mutate]);
};

export const useSession = () => {
  const sessionIdentifier = useAtomValue(sessionIdentifierAtom);

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
        console.log("updating cache directly");
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
        console.log("updated cache!");
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
        });
      } else {
        return addCaskToSessionMutation.mutate({
          sessionId: session.id,
          caskId: cask.id,
        });
      }
    },
    [
      addCaskToSessionMutation,
      removeCaskFromSessionMutation,
      casks,
      session?.id,
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
