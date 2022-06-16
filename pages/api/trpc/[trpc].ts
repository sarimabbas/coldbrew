import * as trpc from "@trpc/server";
import * as trpcNext from "@trpc/server/adapters/next";
import { z } from "zod";
import { prisma } from "../../../lib/db";
import { Session } from "@prisma/client";

export const appRouter = trpc.router().mutation("createNewSession", {
  async resolve({}) {
    console.log("creating new sessions....");
    const session = await prisma.session.create({
      data: {},
    });
    console.log({ session });
    return session;
  },
});

// export type definition of API
export type AppRouter = typeof appRouter;

// export API handler
export default trpcNext.createNextApiHandler({
  router: appRouter,
  createContext: () => null,
});
