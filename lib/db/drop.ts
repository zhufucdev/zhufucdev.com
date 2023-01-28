import {requireDatabase} from "./database";
import {ArticleMeta} from "./article";
import {getUser} from "./user";
import {hasPermission} from "../contract";
import {myId} from "../useUser";
import {Inspiration} from "./inspiration";

export type Droppable = 'recents' | 'articles' | 'inspirations';
type DropResult = {
    permitted: boolean,
    acknowledged: boolean
}

export function canDrop(type: string): boolean {
    return /^(recents)|(articles)|(inspirations)$/g.test(type);
}

export async function drop(type: Droppable, id: any, dropper: UserID): Promise<DropResult> {
    const notPermitted: DropResult = {permitted: false, acknowledged: false}
    if (!canDrop(type)) return notPermitted;
    const user = await getUser(dropper);
    if (!user) return notPermitted;
    const coll = await requireDatabase().collection(type);
    const original = coll.findOne({_id: id});
    if (!original) return notPermitted;

    function checkPermit(author: UserID): boolean {
        if (!hasPermission(user!, 'modify')) {
            if (!hasPermission(user!, 'edit_own_post') || author !== dropper) {
                return false;
            }
        }
        return true;
    }

    switch (type) {
        case "recents":
            if (!checkPermit(myId)) return notPermitted;
            break;
        case "inspirations":
            if (!checkPermit((original as unknown as Inspiration).raiser)) return notPermitted;
            break;
        case "articles":
            if (!checkPermit((original as unknown as ArticleMeta).author)) return notPermitted;
    }
    return {
        permitted: true,
        acknowledged: (await coll.findOneAndDelete({_id: id})).ok === 1
    }
}