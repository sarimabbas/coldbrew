import { schedule } from "@netlify/functions";

export const handler = schedule("@daily", async (event) => {
  await fetch(process.env.REBUILD_URL ?? "", { method: "POST" });
  return {
    statusCode: 200,
  };
});
