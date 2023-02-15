// extracts cask data from homebrew api and stores it in the database
import { getCasks } from "../../lib";
import { prisma } from "../../lib/db";
import pLimit from "p-limit";
import { Cask } from "@prisma/client";
import { NextApiHandler } from "next";

const limit = pLimit(10);

// this is called on a schedule
const handler: NextApiHandler = async () => {
  const { casksList } = await getCasks();

  const rateLimitedPromises = casksList.map((c) =>
    limit(() => {
      const patch: Partial<Cask> = {
        name: c.name,
        homepage: c.homepage,
        installCount: c.count,
        installPercent: c.percent,
        ranking: c.number,
      };
      return prisma.cask.upsert({
        where: {
          id: c.cask,
        },
        create: {
          id: c.cask,
          logoUrl: c.logo,
          ...patch,
        },
        update: patch,
      });
    })
  );

  await Promise.all(rateLimitedPromises);

  return {
    statusCode: 200,
  };
};

export default handler;

export const config = {
  cron: "0 9 * * *",
};
