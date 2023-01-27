import {db, requireDatabase} from "./database";
import {WithLikes} from "./remark";
import {nanoid} from "nanoid";
import {WithComments} from "./comment";

export interface Inspiration extends WithLikes, WithComments {
    _id: InspirationID;
    raiser: UserID;
    body: string;
    implemented: boolean
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
            likes: v.likes ?? [],
            comments: v.comments ?? []
        }
    })
}

export async function getInspiration(id: InspirationID): Promise<Inspiration | null> {
    return await db.collection<Inspiration>(collectionID).findOne({_id: id});
}

export async function addInspiration(raiser: UserID, body: string): Promise<string | undefined> {
    requireDatabase();
    const collection = db.collection<Inspiration>(collectionID);
    const _id = nanoid();
    const value: Inspiration = {
        _id,
        raiser, body,
        implemented: false,
        likes: [],
        comments: []
    };
    const insert = await collection.insertOne(value);
    return insert.acknowledged ? value._id : undefined;
}
