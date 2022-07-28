import db from "./database";

export interface Recent {
  title: string;
  body: string;
  time: Date;
  cover: string;
}

export async function getRecents(): Promise<Recent[]> {
    const r = (await db.collection<Recent>('recents').find().toArray()).slice(-3).reverse();
    global.dbClient?.close();
    return r;
}
