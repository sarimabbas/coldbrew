import React from "react";
import { useSession } from "../lib/useSession";

const SessionPill = () => {
  const { session } = useSession();

  if (!session?.id) return null;

  return (
    <div className="surface edges chisel text-sm px-2 py-1">
      Session ...{session.id.slice(-10)}
    </div>
  );
};

export default SessionPill;
