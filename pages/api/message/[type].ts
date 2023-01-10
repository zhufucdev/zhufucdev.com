import {routeWithIronSession} from "../../../lib/session";
import {NextApiRequest, NextApiResponse} from "next";
import {validUser} from "../../../lib/db/token";
import {addInspiration} from "../../../lib/db/inspiration";

async function messageRoute(req: NextApiRequest, res: NextApiResponse) {
    if (!await validUser(req)) {
        res.status(401).send('unauthorized');
        return;
    }

    const {type} = req.query as {type: MessageType};
    const content = req.body;
    if (!type || typeof content !== 'string') {
        res.status(400).send('bad request');
        return;
    }

    switch (type) {
        case "inspiration":
            await addInspiration(req.session.userID as string, content);
            res.send('success');
            break;
        default:
            res.status(501).send(`messaging as ${type} not supported`);
    }
}

export default routeWithIronSession(messageRoute);