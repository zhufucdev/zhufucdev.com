import {nanoid} from "nanoid";
import {UserID} from "./user";
import {db, requireDatabase} from "./database";
import {NextApiRequest} from "next";

export type TokenID = string;

export interface Token {
    _id: TokenID;
    user: UserID;
}


export async function validToken(token: string, user: UserID): Promise<boolean> {
    requireDatabase();
    const find = await db.collection<Token>("tokens").findOne({_id: token})
    return !(!find || find.user !== user);
}

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
