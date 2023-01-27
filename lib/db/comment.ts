import {requireDatabase} from "./database";
import {nanoid} from "nanoid";

export interface Comment {
    _id: CommentID;
    raiser: UserID;
    content: string;
    belonging: any;
    time: Date;
    modified: boolean;
    children: CommentID[];
}

export interface WithComments {
    _id: any;
    comments: CommentID[];
}

const collectionId = "comments";
type Commentable = 'inspirations';

/**
 * Get a list of all comments of a commentable entity
 * @param holder the entity
 */
export async function getComments(holder: WithComments): Promise<Comment[]> {
    requireDatabase();
    const comments = await db.collection<Comment>(collectionId).find({_id: {$in: holder.comments}});
    return await comments.toArray();
}

/**
 * Attach a comment to an entity
 * @param raiser user who commented
 * @param content the comment body
 * @param holder the entity
 * @param coll name of the {@link holder}'s collection
 * @returns whether the attachment was acknowledged
 */
export async function addComment(
    raiser: UserID,
    content: string,
    holder: WithComments,
    coll: Commentable
): Promise<boolean> {
    requireDatabase();
    const instance: Comment = {
        raiser, content,
        _id: nanoid(),
        belonging: holder._id,
        time: new Date(),
        modified: false,
        children: []
    };

    const local = (await db.collection<Comment>(collectionId).insertOne(instance)).acknowledged;
    if (!local) return false

    const foreign = (await db.collection<WithComments>(coll).findOneAndUpdate({_id: holder._id},
        {$push: {comments: instance._id}}));
    if (!foreign) {
        // undo local operation
        await db.collection<Comment>(collectionId).findOneAndDelete({_id: instance._id});
        return false
    }

    return true
}
