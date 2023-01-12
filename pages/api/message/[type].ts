import {routeWithIronSession} from "../../../lib/session";
import {NextApiRequest, NextApiResponse} from "next";
import {validUser} from "../../../lib/db/token";
import {addInspiration} from "../../../lib/db/inspiration";
import {verifyReCaptcha} from "../../../lib/utility";
import {getAndCheckUserPermission} from "../../../lib/db/user";
import {addRecent} from "../../../lib/db/recent";

async function messageRoute(req: NextApiRequest, res: NextApiResponse) {
    if (!req.session.userID || !await validUser(req)) {
        res.status(401).send('unauthorized');
        return;
    }

    const {type} = req.query as {type: MessageType};
    const {token} = req.body;
    const body = req.body.body.trim();
    if (!type || typeof body !== 'string' || !body || !token) {
        res.status(400).send('bad request');
        return;
    }

    const reCaptchaValid = await verifyReCaptcha(token);
    if (!reCaptchaValid) {
        res.status(400).send('invalid reCaptcha');
        return;
    }

    async function permitted(permit: PermissionID): Promise<boolean> {
        const r = await getAndCheckUserPermission(req.session.userID!, permit);
        if (!r) {
            res.status(403).send(`not permitted to ${permit.replace("_", " ")}`);
        }
        return r;
    }
    let id: string | undefined;
    switch (type) {
        case "inspiration":
            if (!await permitted("raise_inspiration")) return;
            id = await addInspiration(req.session.userID, body);
            break;
        case "recent":
            const {title, image} = req.body;
            if (!title || !image) {
                res.status(400).send('bad request');
                return;
            }
            if (!await permitted("raise_recent")) return;
            id = await addRecent(title, body, image);
            break;
        default:
            res.status(501).send(`messaging as ${type} not supported`);
            return;
    }

    if (id) {
        res.send(id);
    } else {
        res.status(500).send('database not acknowledging');
    }
}

export default routeWithIronSession(messageRoute);