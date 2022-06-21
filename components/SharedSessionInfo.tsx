import { RefreshIcon } from "@heroicons/react/solid";
import React from "react";

const SharedSessionInfo = () => {
  return (
    <div className="p-4 flex flex-col items-center gap-8 justify-center">
      <div>Creating a new session with apps shared with you.</div>
      <RefreshIcon className="h-4 animate-spin opacity-50" />
    </div>
  );
};

export default SharedSessionInfo;
