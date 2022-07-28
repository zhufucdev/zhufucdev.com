import { Binary } from "mongodb";
import db from "./database";

interface AbstractImage {
  _id: string;
  name: string;
  uploadTime: Date;
}

interface Image extends AbstractImage {
  read(): Promise<Uint8Array>;
}

interface ImageStore extends AbstractImage {
  content: Binary;
}

export async function findImage(id: string): Promise<Image | null> {
  async function find(): Promise<ImageStore | null> {
    const r = await db.collection<ImageStore>("images").findOne({ _id: id });
    global.dbClient?.close();
    return r;
  }
  const data = await find();
  if (!data) return null;
  return {
    _id: data._id,
    name: data.name,
    uploadTime: data.uploadTime,
    async read(): Promise<Uint8Array> {
      return (await find())!!.content.buffer;
    },
  };
}
