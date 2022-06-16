import type { NextApiRequest, NextApiResponse } from "next";

// outputs a brewfile or script as with brewfile as here document
const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  const { casks: casksParam, file: fileParam } = req.query;

  let casks: string[] = [];
  if (Array.isArray(casksParam)) {
    casks = casksParam.reduce(
      (prev: string[], curr) =>
        prev.concat(decodeURIComponent(curr).split(",")),
      []
    );
  } else {
    casks = decodeURIComponent(casksParam).split(",");
  }

  const brewfile = [casks.map((c) => `cask "${c}"`).join("\n")].join("\n");

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
