import {NextApiRequest, NextApiResponse} from "next";
import {mergeWith, Remarkable, RemarkMode} from "../../../../../lib/db/remark";
import {withIronSessionApiRoute} from "iron-session/next";
import {sessionOptions} from "../../../../../lib/session";

const invalidIDs = ['undefined', 'null', 'zhufucdev']

async function handler(req: NextApiRequest, res: NextApiResponse) {
    const {type, id, mode} = req.query;
    if (!type || !id || (id as string) in invalidIDs) {
        res.status(400).send('bad request');
        return;
    }
    if (!req.session.userID) {
        res.status(401).send('not logged in');
        return;
    }

    const success = await mergeWith(type as Remarkable, id as string, req.session.userID, mode as RemarkMode);
    res.json({success});
}

export default withIronSessionApiRoute(handler, sessionOptions);