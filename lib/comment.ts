import { nanoid } from "nanoid";
import { RenderingComment } from "../componenets/CommentCard";
import { Commentable } from "./db/comment";
import { User } from "./db/user";

export class CommentUtil {
    static maxLength = 300;
    static checkLength(body: string): number {
        return body.trim().length;
    }
    static validBody(text: string): boolean {
        return text.length > 0 && this.checkLength(text) <= this.maxLength;
    }
    static create(
        raiser: User,
        body: string,
        parent: { id: string; type: Commentable },
        id?: CommentID,
    ): RenderingComment {
        return {
            _id: id ?? nanoid(),
            raiser: raiser._id,
            raiserNick: raiser.nick,
            body,
            time: new Date().toISOString(),
            parent: parent.id,
            parentType: parent.type,
            edited: false,
            comments: [],
            likes: [],
        };
    }
}
