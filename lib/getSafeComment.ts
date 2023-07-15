import {Comment} from "./db/comment";

export interface SafeComment extends Omit<Comment, 'time'> {
    time: string
}

export function getSafeComment(source: Comment): SafeComment {
    return {
        ...source,
        time: source.time.toISOString()
    }
}

export function fromSafeComment(source: SafeComment): Comment {
    return {
        ...source,
        time: new Date(source.time)
    }
}
