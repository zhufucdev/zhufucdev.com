import {db, requireDatabase} from "./database";
import {nanoid} from "nanoid";

export interface PrivateMessage {
    _id: PrivateMessageID;
    receiver: UserID;
    sender: UserID;
    body: string;
}

const collectionId = "pm";

export async function sendPm(sender: UserID, receiver: UserID, body: string): Promise<boolean> {
    requireDatabase();
    const pm: PrivateMessage = {
        _id: nanoid(),
        receiver, sender, body
    }
    const res = await db.collection<PrivateMessage>(collectionId).insertOne(pm);
    return res.acknowledged;
}