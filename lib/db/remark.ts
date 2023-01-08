import {UserID} from "./user";
import {db, requireDatabase} from "./database";

export interface WithLikes {
    likes: UserID[]
}

export interface WithDislikes {
    dislikes: UserID[]
}

export async function mergeWith(collectionID: string, itemID: string,
                                user: UserID, mode: 'like' | 'dislike'): Promise<boolean> {
    requireDatabase();
    const filter = {_id: itemID};
    const origin = await db.collection(collectionID).findOne(filter) as any;

    function requireRemoval(p: string) {
        if (Object.hasOwn(origin, p)) {
            origin[p] = origin[p].filter((v: string) => v != itemID);
        }
    }

    if (mode === "like") {
        requireRemoval("dislikes");
        if (user in origin.likes) {
            return false;
        }
        origin.likes.push(user);
    } else {
        requireRemoval("likes");
        if (user in origin.dislikes) {
            return false;
        }
        origin.dislikes.push(user);
    }

    await db.collection(collectionID)
        .findOneAndReplace(filter, origin);
    return true;
}