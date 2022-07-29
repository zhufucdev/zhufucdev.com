import { db, closeDb, renewDb } from "./database";

export interface Recent {
  title: string;
  body: string;
  time: Date;
  cover: string;
}

export async function getRecents(): Promise<Recent[]> {
  renewDb();
  const r = (await db.collection<Recent>("recents").find().toArray())
    .slice(-3)
    .reverse();
  return r;
}
