import { db, closeDb, renewDb } from "./database";
import { getUser, User, UserID } from "./user";

interface RemoteInspiration {
  raiser: UserID;
  body: string;
  implemented: boolean;
}

export type Inspiration = Omit<RemoteInspiration, "raiser"> & {
  raiser: User | null;
};

export async function getInspirations(): Promise<Inspiration[]> {
  renewDb();
  const raw = await db
    .collection<RemoteInspiration>("inspirations")
    .find()
    .toArray();
  const result = [];
  for (let v of raw) {
    result.push({
      ...v,
      raiser: await getUser(v.raiser),
    });
  }
  return result;
}
