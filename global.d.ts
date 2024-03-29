declare global {
    type UserID = string;
    type TokenID = string;
    type RecentID = string;
    type InspirationID = string;
    type ImageID = string;
    type PrivateMessageID = string;
    type CommentID = string;
    type ArticleID = string;

    type MessageType = 'inspiration' | 'recent' | 'pm' | 'issue';
    type Postable = 'articles' | MessageType;
    type InspirationFlag = 'implemented' | 'not_planned' | 'sus' | 'none';
    type TraceType = 'inspirations' | 'qna' | 'issues';
    type MessageContent = { body: string, title?: string, image?: ImageID };
    type PermissionID =
        | "raise_inspiration"
        | "raise_issue"
        | "raise_recent"
        | "post_article"
        | "pr_article"
        | "send_pm"
        | "comment"
        | "remark"
        | "review"
        | "edit_own_post"
        | "change_nick"
        | "change_avatar"
        | "change_biography"
        | "list_images"
        | "permit"
        | "modify"
        | "default"
        | "*";

    type RequestResult = { success: boolean, respond?: string, msg?: string };
    type ImageUse = 'avatar' | 'cover' | 'post' | 'save';
    type ImageMetaClient = {id: ImageID, uploader: UserID, uploadTime: string, name: string, use: ImageUse}
}

export {};
