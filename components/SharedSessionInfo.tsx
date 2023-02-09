import { ArrowPathIcon } from "@heroicons/react/24/solid";
import React from "react";

const SharedSessionInfo = () => {
  return (
    <div className="flex flex-col items-center justify-center gap-8 p-4">
      <div>Creating a new session with apps shared with you.</div>
      <ArrowPathIcon className="h-4 opacity-50 animate-spin" />
    </div>
  );
};

export default SharedSessionInfo;
