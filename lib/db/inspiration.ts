import {db, requireDatabase} from "./database";
import {WithLikes} from "./remark";
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

export async function getInspiration(id: InspirationID): Promise<Inspiration | null> {
    return await db.collection<Inspiration>(collectionID).findOne({_id: id});
}

export async function addInspiration(raiser: UserID, body: string): Promise<string | undefined> {
    requireDatabase();
    const value = {
        _id: nanoid(),
        raiser, body,
        implemented: false
    } as Inspiration;
    const insert = await db.collection<Inspiration>(collectionID).insertOne(value);
    return insert.acknowledged ? value._id : undefined;
}
