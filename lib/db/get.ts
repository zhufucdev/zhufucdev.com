import { WithId } from "mongodb";
import { requireDatabase } from "./database";

export async function getDoc<T>(collection: string, id: string): Promise<WithId<T> | undefined> {
    const coll = requireDatabase().collection(collection);
    return (await coll.findOne({_id: id})) as WithId<T> | null ?? undefined
}
