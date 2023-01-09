import {Binary} from "mongodb";
import {db, requireDatabase} from "./database";
import {hash, compare} from 'bcrypt';
import {Buffer} from "buffer";

interface UserPassword {
    _id: UserID,
    password: Binary
}

const rounds = 10;

async function encrypt(pwd: string): Promise<Binary> {
    const hashcode = await hash(pwd, rounds);
    return new Binary(Buffer.from(hashcode));
}

/**
 * Set the password of a specific user, overwriting the existing one.
 * @param user the user
 * @param password to be written
 */
export async function setPassword(user: UserID, password: string) {
    requireDatabase();
    const coll = db.collection<UserPassword>("passwords");
    const record = {
        _id: user,
        password: await encrypt(password)
    };
    if (await coll.findOne({_id: user})) {
        await coll.findOneAndReplace({_id: user}, record);
    } else {
        await coll.insertOne(record);
    }
}

/**
 * Compare the password provided and the one in the database
 * @param user on which the comparison should be carried
 * @param password the provided one
 * @returns if the user was found and passwords matched
 */
export async function match(user: UserID, password: string): Promise<boolean> {
    requireDatabase();
    const hashcode = (await db.collection<UserPassword>("passwords").findOne({_id: user}))?.password
    if (!hashcode) {
        return false;
    }
    return await compare(password, hashcode.value() as string);
}
