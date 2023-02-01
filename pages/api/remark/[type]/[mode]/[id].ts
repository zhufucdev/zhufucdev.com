import {NextApiRequest, NextApiResponse} from "next";
import {mergeWith, Remarkable, RemarkMode} from "../../../../../lib/db/remark";
import {routeWithIronSession} from "../../../../../lib/session";
import {validUser} from "../../../../../lib/db/token";
import {getAndCheckUserPermission} from "../../../../../lib/db/user";

const invalidIDs = ['undefined', 'null', 'zhufucdev']

async function handler(req: NextApiRequest, res: NextApiResponse) {
    const {type, id, mode} = req.query;
    if (!type || !id || invalidIDs.includes(id as string)) {
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

    const success = await mergeWith(type as Remarkable, id as string, req.session.userID, mode as RemarkMode);
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