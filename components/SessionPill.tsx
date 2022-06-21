import React from "react";
import { useSession } from "../lib/useSession";
import cx from "classnames";

interface ISessionPillProps {
  className?: string;
}
const SessionPill = ({ className }: ISessionPillProps) => {
  const { session } = useSession();

  if (!session?.id) return null;

  return (
    <div className={cx("surface edges chisel text-sm px-2 py-1", className)}>
      Session ...{session.id.slice(-10)}
    </div>
  );
};

export default SessionPill;
