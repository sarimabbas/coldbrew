import * as trpc from "@trpc/server";
import * as trpcNext from "@trpc/server/adapters/next";
import { z } from "zod";
import { prisma } from "../../../lib/db";
import { exclude } from "../../../lib/utils";

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
      if (session) {
        return exclude(session, "accessToken");
      }
      return null;
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
    input: z.object({
      bootstrapWithExistingSessionId: z.string().optional(),
    }),
    async resolve({ input }) {
      // bootstrap from existing
      if (input.bootstrapWithExistingSessionId) {
        const existingSession = await prisma.session.findFirst({
          where: {
            id: input.bootstrapWithExistingSessionId,
          },
          include: {
            casks: true,
          },
        });
        return prisma.session.create({
          data: {
            casks: {
              connect: existingSession?.casks.map((c) => ({ id: c.id })),
            },
          },
        });
      }
      // start fresh
      return prisma.session.create({
        data: {},
      });
    },
  })
  .mutation("removeCaskFromSession", {
    input: z.object({
      sessionId: z.string(),
      accessToken: z.string(),
      caskId: z.string(),
    }),
    async resolve({ input }) {
      // check token
      const findSession = await prisma.session.findFirst({
        where: {
          AND: [{ id: input.sessionId }, { accessToken: input.accessToken }],
        },
      });
      if (!findSession) {
        throw new trpc.TRPCError({
          code: "UNAUTHORIZED",
          message: "Access token not valid for this operation",
        });
      }
      // update session
      const updatedSession = await prisma.session.update({
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
      return exclude(updatedSession, "accessToken");
    },
  })
  .mutation("addCaskToSession", {
    input: z.object({
      sessionId: z.string(),
      accessToken: z.string(),
      caskId: z.string(),
    }),
    async resolve({ input }) {
      // check token
      const findSession = await prisma.session.findFirst({
        where: {
          AND: [{ id: input.sessionId }, { accessToken: input.accessToken }],
        },
      });
      if (!findSession) {
        throw new trpc.TRPCError({
          code: "UNAUTHORIZED",
          message: "Access token not valid for this operation",
        });
      }
      // update session
      const updatedSession = await prisma.session.update({
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
      return exclude(updatedSession, "accessToken");
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
