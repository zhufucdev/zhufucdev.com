import {NextApiRequest, NextApiResponse} from "next";
import {asRemarkable, mergeWith, Remarkable, RemarkMode} from "../../../../../lib/db/remark";
import {routeWithIronSession} from "../../../../../lib/session";
import {validUser} from "../../../../../lib/db/token";
import {getAndCheckUserPermission} from "../../../../../lib/db/user";
import {verifyReCaptcha} from "../../../../../lib/utility";

const invalidIDs = ['undefined', 'null', 'zhufucdev']

async function handler(req: NextApiRequest, res: NextApiResponse) {
    const {type, id, mode} = req.query;
    const {token} = req.body;
    const remarkable = asRemarkable(type as string);
    if (!remarkable || !id || invalidIDs.includes(id as string) || !token) {
        res.status(400).send('bad request');
        return;
    }
    if (!req.session.userID || !await validUser(req)) {
        res.status(401).send('not logged in');
        return;
    }

    if (!await getAndCheckUserPermission(req.session.userID, "remark")) {
        res.status(403).send('not permitted to remark');
        return;
    }

    if (!await verifyReCaptcha(token)) {
        res.status(403).send('invalid reCAPTCHA');
        return;
    }

    const success = await mergeWith(
        remarkable,
        id as string,
        'likes',
        req.session.userID,
        mode as RemarkMode);
    if (success) {
        postMerge(type as Remarkable, res);
        res.send('success');
    } else {
        res.status(500).send('database not acknowledging');
    }
}

async function postMerge(type: Remarkable, res: NextApiResponse) {
    switch (type){
        case "inspirations":
        case "recents":
            await res.revalidate('/');
            break;
        case "articles":
            await res.revalidate('/article');
    }
}

export default routeWithIronSession(handler);