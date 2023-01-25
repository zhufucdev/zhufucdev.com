import {db, requireDatabase} from "./database";
import {hasPermission} from "../contract";

export type UserProfile = {
    nick?: string,
    avatar?: string,
    biography?: string,
}

export type User = Omit<UserProfile, "nick"> & {
    permissions: PermissionID[],
    _id: UserID,
    nick: string,
    cover?: ImageID,
    registerTime: Date,
}

const collectionId = "users";

/**
 * Server-side user profile look up
 */
export async function getUser(id: UserID): Promise<User | null> {
    requireDatabase();
    return await db.collection<User>(collectionId).findOne({_id: id});
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
    await db.collection<User>(collectionId).insertOne(result);
    return result;
}

/**
 * Find and update a {@link User} using some {@link UserProfile}
 * @param id to locate the user
 * @param modification profile to update, each field of which can be undefined if not to update
 * @return whether the operation is acknowledged
 */
export async function modifyUser(id: string, modification: UserProfile): Promise<boolean> {
    requireDatabase();
    const res = await db.collection<User>(collectionId).findOneAndUpdate({_id: id}, {"$set": modification});
    return res.ok === 1
}

export async function getAndCheckUserPermission(id: UserID, permit: PermissionID): Promise<boolean> {
    const user = await getUser(id);
    if (!user) return false;
    return hasPermission(user, permit);
}