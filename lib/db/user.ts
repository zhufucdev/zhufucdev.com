import {db, requireDatabase} from "./database";

const defaultPermissions: PermissionID[] = [
    "raise_issue",
    "raise_inspiration",
    "remark",
    "comment",
    "edit_own_post",
    "change_nick",
    "change_avatar",
    "change_biography"
]

export type User = {
    permissions: PermissionID[],
    _id: UserID,
    nick: string,
    avatar?: string,
    biography?: string,
    registerTime: Date,
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
        permissions: ["default"],
        registerTime: new Date()
    };
    await db.collection<User>("users").insertOne(result);
    return result;
}

export function hasPermission(user: User, permit: PermissionID): boolean {
    if (user.permissions.includes("default")) {
        return defaultPermissions.includes(permit);
    } else if (user.permissions.includes("*")) {
        return true;
    } else {
        return user.permissions.includes(permit);
    }
}

export async function getAndCheckUserPermission(id: UserID, permit: PermissionID): Promise<boolean> {
    const user = await getUser(id);
    if (!user) return false;
    return hasPermission(user, permit);
}