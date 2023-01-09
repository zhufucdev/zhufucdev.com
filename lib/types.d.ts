type UserID = string;
type TokenID = string;
type RecentID = string;
type InspirationID = string;
type ImageID = string;

type PermissionID =
    | "raise_inspiration"
    | "raise_issue"
    | "comment"
    | "change_nick"
    | "change_avatar"
    | "change_biography"
    | "permit"
    | "modify"
    | "*";

type User = {
    permissions: PermissionID[],
    _id: UserID,
    nick: string,
    avatar?: string,
    biography?: string,
    registerTime: Date,
}
