import React from "react";
import { trpc } from "../lib/trpc";

const LastUpdated = () => {
  const { data } = trpc.useQuery(["getLastUpdated"]);
  if (data) {
    return (
      <div className="text-sm">
        Last updated: {new Date(data).toLocaleDateString()}
      </div>
    );
  }
  return null;
};

export default LastUpdated;
