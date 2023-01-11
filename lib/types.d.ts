type UserID = string;
type TokenID = string;
type RecentID = string;
type InspirationID = string;
type ImageID = string;
type PrivateMessageID = string

type MessageType = 'inspiration' | 'pm' | 'issue';
type PermissionID =
    | "raise_inspiration"
    | "raise_issue"
    | "comment"
    | "remark"
    | "edit_own_post"
    | "change_nick"
    | "change_avatar"
    | "change_biography"
    | "permit"
    | "modify"
    | "default"
    | "*";

type RequestResult = { success: boolean, respond?: string, msg?: string };