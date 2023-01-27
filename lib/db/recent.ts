import {db, requireDatabase} from "./database";
import {WithDislikes, WithLikes} from "./remark";
import {nanoid} from "nanoid";


export interface Recent extends WithLikes, WithDislikes {
    _id: RecentID;
    title: string;
    body: string;
    time: Date;
    cover: ImageID;
}

const collectionId = "recents";

export async function getRecents(): Promise<Recent[]> {
    requireDatabase();
    return (await db.collection<Recent>(collectionId).find().toArray())
        .slice(-3)
        .reverse()
        .map(
            (v) => {
                return {
                    ...v,
                    likes: v.likes ?? [],
                    dislikes: v.dislikes ?? []
                }
            }
        );
}

export async function addRecent(title: string, body: string, image: ImageID): Promise<RecentID | undefined> {
    requireDatabase();
    const recent: Recent = {
        _id: nanoid(),
        cover: image,
        likes: [],
        dislikes: [],
        time: new Date(),
        body, title
    }
    const {acknowledged} = await db.collection<Recent>(collectionId).insertOne(recent);
    if (acknowledged) {
        return recent._id;
    }
}