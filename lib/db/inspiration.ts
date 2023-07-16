import {db, requireDatabase} from "./database";
import {WithLikes} from "./remark";
import {WithComments} from "./comment";

export interface Inspiration extends WithLikes, WithComments {
    _id: InspirationID;
    raiser: UserID;
    body: string;
    flag: InspirationFlag;
    archived: boolean;
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
            _id: v._id,
            body: v.body,
            flag: v.flag ?? 'none',
            raiser: v.raiser,
            likes: v.likes ?? [],
            comments: v.comments ?? [],
            archived: Boolean(v.archived)
        }
    })
}

export async function getInspiration(id: InspirationID): Promise<Inspiration | undefined> {
    return await db.collection<Inspiration>(collectionID).findOne({_id: id}) ?? undefined;
}

export async function addInspiration(id: InspirationID, raiser: UserID, body: string): Promise<boolean> {
    requireDatabase();
    const collection = db.collection<Inspiration>(collectionID);
    const value: Inspiration = {
        _id: id,
        raiser, body,
        flag: 'none',
        likes: [],
        comments: [],
        archived: false
    };
    const insert = await collection.insertOne(value);
    return insert.acknowledged;
}
