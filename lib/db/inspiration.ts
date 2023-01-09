import {db, requireDatabase} from "./database";
import {WithLikes} from "./remark";
import {WithId} from "mongodb";

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