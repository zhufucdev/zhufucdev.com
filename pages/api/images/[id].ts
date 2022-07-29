import { NextApiRequest, NextApiResponse } from "next";
import { findImage } from "../../../db/image";

import { readFile } from "fs/promises";
import path from "path";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { id } = req.query;
  const image = await findImage(id as string);
  if (!image) {
    res
      .status(200)
      .setHeader("Content-Type", "image/svg+xml")
      .send(await readFile(path.join('public', 'error.svg')));
  } else {
    res.status(200).setHeader("Content-Type", "image/webp").send(await image.read());
  }
}
