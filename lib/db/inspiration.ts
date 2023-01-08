import {db, closeDb, requireDatabase} from "./database";
import {getUser, User, UserID} from "./user";
import {mergeWith, WithDislikes, WithLikes} from "./remark";

export type InspirationID = string;

export interface Inspiration extends WithLikes {
    _id: InspirationID;
    raiser: UserID;
    body: string;
    implemented: boolean;
}

const collectionID = "inspirations";

export async function getInspirations(): Promise<Inspiration[]> {
    requireDatabase();
    return await db
        .collection<Inspiration>(collectionID)
        .find()
        .toArray();
}