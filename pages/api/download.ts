import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "../../lib/db";

// outputs a brewfile or script as with brewfile as here document
const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  const { session: sessionParam, file: fileParam } = req.query;

  if (!sessionParam) {
    res.status(400).send("no session param");
  }

  const sessionId = Array.isArray(sessionParam)
    ? sessionParam?.[0]
    : sessionParam;

  const session = await prisma.session.findFirst({
    where: {
      id: sessionId,
    },
    include: {
      casks: true,
    },
  });

  const casks = session?.casks ?? [];

  const brewfile = [casks.map((c) => `cask "${c.id}"`).join("\n")].join("\n");

  if (fileParam) {
    res.setHeader("Content-Type", "text/plain");
    res.setHeader("Content-disposition", "attachment; filename=Brewfile");
    res.send(brewfile);
    return;
  }

  const script = [
    "#!/bin/sh",
    "brew bundle --no-lock --file=/dev/stdin <<EOF",
    brewfile,
    "EOF",
  ].join("\n\n");

  res.status(200).send(script);
};

export default handler;
