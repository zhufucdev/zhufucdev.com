import db from "./database";
import { UserID } from "./user";

export interface Inspiration {
  rasier: UserID
  title: string
  body: string
}

export async function getInspirations(): Promise<Inspiration[]> {
  return db.collection<Inspiration>('inspirations').find().toArray();
}