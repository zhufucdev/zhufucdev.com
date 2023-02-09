import {db, requireDatabase} from "./database";

export interface WithLikes {
    likes: UserID[],

}

export interface WithDislikes {
    dislikes: UserID[]
}

export type Remarkable = 'recents' | 'inspirations' | 'articles'
export type RemarkMode = 'like' | 'dislike' | 'none' | 'implemented' | 'not_planned' | 'sus' | 'archived'
export type RemarkPosition = 'likes' | 'flag' | 'archive'

export async function mergeWith(collectionID: Remarkable, itemID: any, where: RemarkPosition,
                                user: UserID, mode: RemarkMode): Promise<boolean> {
    requireDatabase();
    const filter = {_id: itemID};
    const origin = await db.collection(collectionID).findOne(filter) as any;
    if (!origin) throw new Error(`${collectionID} with id ${itemID} was not found`)

    if (where === 'likes') {
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
                break
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
                break
            case "none":
                requireRemoval("likes");
                requireRemoval("dislikes");
                break
        }
        const {ok} = await db.collection(collectionID).findOneAndUpdate(filter, {
            $set: {
                likes: origin.likes,
                dislikes: origin.dislikes
            }
        });
        return ok == 1;
    } else if (where === 'flag') {
        switch (mode) {
            case "implemented":
            case "not_planned":
            case "sus":
            case "none":
                const {ok} = await db.collection(collectionID).findOneAndUpdate(filter, {
                    $set: {flag: mode}
                })
                return ok === 1;
        }
        throw new Error(`unknown mode: ${mode}`);
    } else if (where === 'archive') {
        let archived = mode === 'archived';
        const {ok} = await db.collection(collectionID).findOneAndUpdate(filter, {
            $set: {archived}
        });
        return ok === 1;
    }

    throw new Error(`unknown position: ${where}`)
}