import {db, requireDatabase} from "./database";

export interface WithLikes {
    likes: UserID[],

}

export interface WithDislikes {
    dislikes: UserID[]
}

export type Remarkable = 'recents' | 'inspirations' | 'articles'
export type RemarkMode = 'like' | 'dislike' | 'none' | 'implement'

export async function mergeWith(collectionID: Remarkable, itemID: any,
                                user: UserID, mode: RemarkMode): Promise<boolean> {
    requireDatabase();
    const filter = {_id: itemID};
    const origin = await db.collection(collectionID).findOne(filter) as any;
    if (!origin) throw new Error(`${collectionID} with id ${itemID} was not found`)

    function requireRemoval(p: string) {
        if (origin[p]) {
            origin[p] = origin[p].filter((v: string) => v != user);
        }
    }

    switch (mode) {
        case "like":
            requireRemoval("dislikes");
            if (Array.isArray(origin.likes)) {
                if (origin.likes.includes(user)) {
                    return true;
                }
                origin.likes.push(user);
            } else {
                origin.likes = [user];
            }
            return await updateLikeDislikes();
        case "dislike":
            requireRemoval("likes");
            if (Array.isArray(origin.dislikes)) {
                if (origin.dislikes.includes(user)) {
                    return true;
                }
                origin.dislikes.push(user);
            } else {
                origin.dislikes = [user];
            }
            return await updateLikeDislikes();
        case "none":
            requireRemoval("likes");
            requireRemoval("dislikes");
            return await updateLikeDislikes();
        case "implement":
            const {ok} = await db.collection(collectionID).findOneAndUpdate(filter, {
                $set: {
                    implemented: !origin.implemented
                }
            })
            return ok === 1;
    }

    async function updateLikeDislikes() {
        const {ok} = await db.collection(collectionID).findOneAndUpdate(filter, {
            $set: {
                likes: origin.likes,
                dislikes: origin.dislikes
            }
        });
        return ok == 1;
    }

    return false;
}