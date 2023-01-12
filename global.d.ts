declare global {
    type UserID = string;
    type TokenID = string;
    type RecentID = string;
    type InspirationID = string;
    type ImageID = string;
    type PrivateMessageID = string

    type MessageType = 'inspiration' | 'recent' | 'pm' | 'issue';
    type MessageContent = { body: string, title?: string, image?: ImageID };
    type PermissionID =
        | "raise_inspiration"
        | "raise_issue"
        | "raise_recent"
        | "send_pm"
        | "comment"
        | "remark"
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
}

export {};
