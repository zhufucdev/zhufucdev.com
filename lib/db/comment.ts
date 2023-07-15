import {requireDatabase} from "./database";
import {nanoid} from "nanoid";
import {WithLikes} from "./remark";

export interface Comment extends WithComments, WithLikes {
    _id: CommentID;
    raiser: UserID;
    body: string;
    parent: any;
    parentType: Commentable,
    time: Date;
    edited: boolean;
}

export interface WithComments {
    _id: any;
    comments: CommentID[];
}

const collectionId = "comments";
export type Commentable = 'inspirations' | 'articles' | 'comments';

export function asCommentable(name: string): Commentable | undefined {
    switch (name) {
        case 'inspirations':
        case 'articles':
        case 'comments':
            return name
        default:
            return undefined
    }
}

/**
 * Get a list of all comments of a commentable entity
 * @param holder the entity
 */
export async function getComments(holder: WithComments): Promise<Comment[]> {
    requireDatabase();
    const comments = db.collection<Comment>(collectionId).find({_id: {$in: holder.comments}});
    return await comments.sort('time').toArray();
}

/**
 * Get a concrete comment
 * @param id the identifier
 */
export async function getComment(id: CommentID): Promise<Comment | undefined> {
    requireDatabase();
    return await db.collection<Comment>(collectionId).findOne({_id: id}) ?? undefined;
}

/**
 * Attach a comment to an entity
 * @param raiser user who commented
 * @param content the comment body
 * @param target the entity
 * @param coll name of the {@link target}'s collection
 * @returns whether the attachment was acknowledged
 */
export async function addComment(
    raiser: UserID,
    content: string,
    target: WithComments,
    coll: Commentable
): Promise<Comment | undefined> {
    requireDatabase();
    const instance: Comment = {
        raiser, body: content,
        _id: nanoid(),
        parent: target._id,
        parentType: coll,
        time: new Date(),
        edited: false,
        comments: [],
        likes: []
    };

    const local = (await db.collection<Comment>(collectionId).insertOne(instance)).acknowledged;
    if (!local) return

    const foreign = (await db.collection<WithComments>(coll).findOneAndUpdate({_id: target._id},
        {$push: {comments: instance._id}}));
    if (foreign.ok === 0) {
        // undo local operation
        await db.collection<Comment>(collectionId).findOneAndDelete({_id: instance._id});
        return
    }

    return instance
}

/**
 * Update one or more properties of some comment
 * @param id the identifier
 * @param update the new content
 */
export async function updateComment(id: CommentID, update: Partial<Comment>): Promise<boolean> {
    requireDatabase();
    const collection = db.collection(collectionId);
    const res = await collection.findOneAndUpdate({_id: id}, {$set: update});
    return res.ok === 1;
}

