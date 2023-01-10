import {db, requireDatabase} from "./database";
import {WithLikes} from "./remark";
import {ObjectId, WithId} from "mongodb";
import {nanoid} from "nanoid";

export interface Inspiration extends WithLikes {
    _id: InspirationID;
    raiser: UserID;
    body: string;
    implemented: boolean;
}

const collectionID = "inspirations";

export async function getInspirations(): Promise<Inspiration[]> {
    requireDatabase();
    let find = await db
        .collection<Inspiration>(collectionID)
        .find()
        .toArray();
    find = find.reverse();
    return find.map(v => {
        return {
            ...v,
            likes: v.likes ?? []
        }
    })
}

export async function addInspiration(raiser: UserID, body: string): Promise<boolean> {
    requireDatabase();
    const value = {
        _id: nanoid(),
        raiser, body,
        implemented: false
    } as Inspiration;
    const insert = await db.collection<Inspiration>(collectionID).insertOne(value);
    return insert.acknowledged;
}
