import { schedule } from "@netlify/functions";
import fetch from "node-fetch";

export const handler = schedule("@daily", async (event) => {
  await fetch("/.netlify/functions/extract-background", { method: "POST" });
  return {
    statusCode: 200,
  };
});
