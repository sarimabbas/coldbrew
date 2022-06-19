// extracts cask data from homebrew api and stores it in the database
import { Handler } from "@netlify/functions";
import { getCasks } from "../../lib";
import { prisma } from "../../lib/db";
import pLimit from "p-limit";

const limit = pLimit(10);

export const handler: Handler = async (event) => {
  const { casksList } = await getCasks();

  const rateLimitedPromises = casksList.map((c) =>
    limit(() =>
      prisma.cask.upsert({
        where: {
          id: c.cask,
        },
        create: {
          id: c.cask,
        },
        update: {
          name: c.name,
          homepage: c.homepage,
          installCount: c.count,
          installPercent: c.percent,
          logoUrl: c.logo,
          ranking: c.number,
        },
      })
    )
  );

  await Promise.all(rateLimitedPromises);

  return {
    statusCode: 200,
  };
};
