import {db, requireDatabase} from "./database";

const defaultPermissions: PermissionID[] = [
    "raise_issue",
    "raise_inspiration",
    "comment",
    "change_nick",
    "change_avatar",
    "change_biography"
]

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
