import {db, requireDatabase} from "./database";

export type UserID = string;

export type PermissionID =
    | "raise_inspiration"
    | "raise_issue"
    | "comment"
    | "change_nick"
    | "change_avatar"
    | "change_biography"
    | "permit"
    | "modify"
    | "*";


const defaultPermissions: PermissionID[] = [
    "raise_issue",
    "raise_inspiration",
    "comment",
    "change_nick",
    "change_avatar",
    "change_biography"
]

export interface User {
    permissions: PermissionID[];
    _id: UserID;
    nick: string;
    avatar?: string;
    biography?: string;
    registerTime: Date;
}

/**
 * Normie knows how it works.
 */
export async function getUser(id: UserID): Promise<User | null> {
    requireDatabase();
    return await db.collection<User>("users").findOne({_id: id});
}

/**
 * Create a new user out of nowhere.
 * @param id corresponding to the "_id" field.
 * @param nick the "nick" field.
 * @returns the expected user, or null if the id was taken.
 */
export async function createUser(id: string, nick: string): Promise<User | null> {
    requireDatabase();
    const result: User = {
        _id: id,
        nick,
        permissions: defaultPermissions,
        registerTime: new Date()
    };
    await db.collection<User>("users").insertOne(result);
    return result;
}
