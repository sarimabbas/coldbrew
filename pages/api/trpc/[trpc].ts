import * as trpc from "@trpc/server";
import * as trpcNext from "@trpc/server/adapters/next";
import { z } from "zod";
import { prisma } from "../../../lib/db";

export const appRouter = trpc
  .router()
  .query("getSession", {
    input: z.object({
      sessionId: z.string(),
    }),
    async resolve({ input }) {
      const session = await prisma.session.findFirst({
        where: {
          id: input.sessionId,
        },
        include: {
          casks: true,
        },
      });
      return session;
    },
  })
  .query("getCasks", {
    input: z.object({
      query: z.string().optional(),
      skip: z.number().optional().default(0),
      take: z.number().optional().default(200),
    }),
    async resolve({ input }) {
      const whereClause =
        input.query && input.query.length > 0
          ? {
              OR: [
                {
                  name: {
                    contains: input?.query,
                  },
                },
                {
                  id: {
                    contains: input?.query,
                  },
                },
              ],
            }
          : undefined;

      return prisma.cask.findMany({
        skip: input?.skip,
        take: input?.take,
        orderBy: {
          ranking: "asc",
        },
        where: whereClause,
      });
    },
  })
  .mutation("createNewSession", {
    async resolve({}) {
      const session = await prisma.session.create({
        data: {},
      });
      return session;
    },
  })
  .mutation("removeCaskFromSession", {
    input: z.object({
      sessionId: z.string(),
      caskId: z.string(),
    }),
    async resolve({ input }) {
      return prisma.session.update({
        where: {
          id: input.sessionId,
        },
        data: {
          casks: {
            disconnect: {
              id: input.caskId,
            },
          },
        },
        include: {
          casks: true,
        },
      });
    },
  })
  .mutation("addCaskToSession", {
    input: z.object({
      sessionId: z.string(),
      caskId: z.string(),
    }),
    async resolve({ input }) {
      console.log({ input });
      return prisma.session.update({
        where: {
          id: input.sessionId,
        },
        data: {
          casks: {
            connect: {
              id: input.caskId,
            },
          },
        },
        include: {
          casks: true,
        },
      });
    },
  });

// export type definition of API
export type AppRouter = typeof appRouter;

// export API handler
export default trpcNext.createNextApiHandler({
  router: appRouter,
  createContext: () => null,
  // disabling batching to avoid optimistic mutation flicker in react query
  batching: {
    enabled: false,
  },
});
