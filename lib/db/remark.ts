import {UserID} from "./user";
import {db, requireDatabase} from "./database";

export interface WithLikes {
    likes: UserID[]
}

export interface WithDislikes {
    dislikes: UserID[]
}

export type Remarkable = 'recents' | 'inspirations'
export type RemarkMode = 'like' | 'dislike' | 'none'

export async function mergeWith(collectionID: Remarkable, itemID: any,
                                user: UserID, mode: RemarkMode): Promise<boolean> {
    requireDatabase();
    const filter = {_id: itemID};
    const origin = await db.collection(collectionID).findOne(filter) as any;
    if (!origin) throw new Error(`${collectionID} with id ${itemID} was not found`)

    function requireRemoval(p: string) {
        if (Object.hasOwn(origin, p)) {
            origin[p] = origin[p].filter((v: string) => v != user);
        }
    }

    if (mode === "like") {
        requireRemoval("dislikes");
        if (Array.isArray(origin.likes)) {
            if (origin.likes.includes(user)) {
                return false;
            }
            origin.likes.push(user);
        } else {
            origin.likes = [user];
        }
    } else if (mode == "dislike") {
        requireRemoval("likes");
        if (Array.isArray(origin.dislikes)) {
            if (origin.dislikes.includes(user)) {
                return false;
            }
            origin.dislikes.push(user);
        } else {
            origin.dislikes = [user];
        }
    } else {
        requireRemoval("likes");
        requireRemoval("dislikes");
    }

    await db.collection(collectionID)
        .findOneAndReplace(filter, origin);
    return true;
}