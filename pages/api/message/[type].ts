import {routeWithIronSession} from "../../../lib/session";
import {NextApiRequest, NextApiResponse} from "next";
import {validUser} from "../../../lib/db/token";
import {addInspiration} from "../../../lib/db/inspiration";
import {verifyReCaptcha} from "../../../lib/utility";

async function messageRoute(req: NextApiRequest, res: NextApiResponse) {
    if (!await validUser(req)) {
        res.status(401).send('unauthorized');
        return;
    }

    const {type} = req.query as {type: MessageType};
    const {body, token} = req.body;
    if (!type || typeof body !== 'string' || !token) {
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
            const id = await addInspiration(req.session.userID as string, body);
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