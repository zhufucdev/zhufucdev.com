import {db, requireDatabase} from "./database";
import {WithDislikes, WithLikes} from "./remark";
import {WithId} from "mongodb";


export interface Recent extends WithLikes, WithDislikes {
    _id: RecentID;
    title: string;
    body: string;
    time: Date;
    cover: string;
}

export async function getRecents(): Promise<Recent[]> {
    requireDatabase();
    return (await db.collection<Recent>("recents").find().toArray())
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
