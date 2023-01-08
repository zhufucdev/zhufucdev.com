import {NextApiRequest, NextApiResponse} from "next";
import {mergeWith} from "../../../../../lib/db/remark";

const invalidIDs = ['undefined', 'null', 'zhufucdev']

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const {type, id, mode} = req.query;
    if (!type || !id || (id as string) in invalidIDs) {
        res.status(400).send('bad request');
        return;
    }
    if (!req.session.userID) {
        res.status(401).send('not logged in');
        return;
    }

    const success = await mergeWith(type as string, id as string, req.session.userID, mode as any);
    res.json({success});
}