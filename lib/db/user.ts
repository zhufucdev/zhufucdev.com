import {db, requireDatabase} from "./database";
import {hasPermission} from "../contract";

export type User = {
    permissions: PermissionID[],
    _id: UserID,
    nick: string,
    avatar?: string,
    biography?: string,
    cover?: ImageID,
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

export async function getAndCheckUserPermission(id: UserID, permit: PermissionID): Promise<boolean> {
    const user = await getUser(id);
    if (!user) return false;
    return hasPermission(user, permit);
}