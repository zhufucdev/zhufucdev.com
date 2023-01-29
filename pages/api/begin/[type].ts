import {routeWithIronSession} from "../../../lib/session";
import {nanoid} from "nanoid";
import {validUser} from "../../../lib/db/token";

export default routeWithIronSession(async (req, res) => {
    const {type} = req.query;
    if (!type) {
        res.status(400).send('bad request');
        return
    }

    if (!await validUser(req)) {
        res.status(403).send('unauthorized');
        return
    }

    if (!globalThis.postToken) {
        globalThis.postToken = {};
    }
    const token = nanoid();
    postToken[token] = type as Postable;
    res.send(token);
})

export function validRef(ref: string, type: Postable): boolean {
    return postToken[ref] === type;
}

declare global {
    var postToken: {[key: string]: Postable}
}