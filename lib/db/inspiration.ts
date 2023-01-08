import {db, closeDb, requireDatabase} from "./database";
import {getUser, User, UserID} from "./user";
import {mergeWith, WithDislikes, WithLikes} from "./remark";
import {WithId} from "mongodb";

export type InspirationID = string;

export interface Inspiration extends WithLikes, WithId<InspirationID> {
    raiser: UserID;
    body: string;
    implemented: boolean;
}

const collectionID = "inspirations";

export async function getInspirations(): Promise<Inspiration[]> {
    requireDatabase();
    const find = await db
        .collection<Inspiration>(collectionID)
        .find()
        .toArray();
    return find.map(v => {
        return {
            ...v,
            likes: v.likes ?? []
        }
    })
}