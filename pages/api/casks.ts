import type { NextApiRequest, NextApiResponse } from "next";
import { getCasks } from "../../lib";

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  const casks = await getCasks();
  res.status(200).json({ casks });
};

export default handler;
