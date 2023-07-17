import { nanoid } from "nanoid";
import { RenderingComment } from "../componenets/CommentCard";
import {Comment, Commentable} from "./db/comment";
import { User } from "./db/user";

export class CommentUtil {
    static maxLength = 300;
    static checkLength(body: string): number {
        return body.trim().length;
    }

    static validBody(text: string): boolean {
        const length = this.checkLength(text);
        return length > 0 && length <= this.maxLength;
    }

    static create(
        raiser: User,
        body: string,
        parent: { id: string; type: Commentable },
        id?: CommentID,
    ): Comment {
        return {
            _id: id ?? nanoid(),
            raiser: raiser._id,
            body,
            time: new Date(),
            parent: parent.id,
            parentType: parent.type,
            edited: false,
            comments: [],
            likes: [],
        };
    }
}

export class RenderingCommentUtil {
    static create(
        raiser: User,
        body: string,
        id?: CommentID,
    ): RenderingComment {
        return {
            _id: id ?? nanoid(),
            raiser: raiser._id,
            raiserNick: raiser.nick,
            body,
            edited: false,
            comments: [],
            likes: [],
        };
    }

}