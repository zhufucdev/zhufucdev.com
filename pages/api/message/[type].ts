import {routeWithIronSession} from "../../../lib/session";
import {NextApiRequest, NextApiResponse} from "next";
import {validUser} from "../../../lib/db/token";
import {addInspiration} from "../../../lib/db/inspiration";
import {verifyReCaptcha} from "../../../lib/utility";
import {getAndCheckUserPermission} from "../../../lib/db/user";

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

    switch (type) {
        case "inspiration":
            if (!await getAndCheckUserPermission(req.session.userID, "raise_inspiration")) {
                return;
            }
            const id = await addInspiration(req.session.userID, body);
            if (id)
                res.send(id);
            else
                res.status(500).send('database not acknowledging');
            break;
        default:
            res.status(501).send(`messaging as ${type} not supported`);
    }
}

export default routeWithIronSession(messageRoute);