import {db, requireDatabase} from "./database";
import {WithDislikes, WithLikes} from "./remark";
import {WithId} from "mongodb";

export type RecentID = string

export interface Recent extends WithLikes, WithDislikes, WithId<RecentID> {
    title: string;
    body: string;
    time: Date;
    cover: string;
}

export async function getRecents(): Promise<Recent[]> {
    requireDatabase();
    const r = (await db.collection<Recent>("recents").find().toArray())
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
    return r;
}
