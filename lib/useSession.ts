import { useEffect } from "react";
import { useAtom } from "jotai";
import { sessionIdentifierAtom } from "./store";
import { trpc } from "./trpc";

const useSession = () => {
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
      console.log("starting mutatioN!");
      mutate();
    }
  }, [sessionIdentifier, mutate]);
};

export default useSession;
