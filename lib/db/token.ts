import {nanoid} from "nanoid";
import {db, requireDatabase} from "./database";
import {NextApiRequest} from "next";


export interface Token {
    _id: TokenID;
    user: UserID;
}

const collectionId = "tokens";

export async function validToken(token: string, user: UserID): Promise<boolean> {
    requireDatabase();
    const find = await db.collection<Token>(collectionId).findOne({_id: token})
    return find !== null && find.user === user;
}

export async function invalidToken(token: string): Promise<boolean> {
    requireDatabase();
    const removal = await db.collection<Token>(collectionId).deleteOne({_id: token});
    return removal && removal.acknowledged;
}

/**
 * Verify {@link accessToken} with {@link userID}
 * @param req where this pair comes from
 */
export async function validUser(req: NextApiRequest): Promise<boolean> {
    if (!req.session.accessToken || !req.session.userID) return false;
    return validToken(req.session.accessToken, req.session.userID);
}

export async function generate(user: UserID): Promise<TokenID> {
    requireDatabase();
    const coll = db.collection<Token>("tokens");
    const find = await coll.findOne({user});
    if (find) {
        return find._id;
    }
    const generated = nanoid(26);
    await coll.insertOne({_id: generated, user});
    return generated;
}
