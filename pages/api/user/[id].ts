import {NextApiRequest, NextApiResponse} from "next";
import {getUser} from "../../../lib/db/user";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const {id} = req.query;
    if (typeof id === 'string') {
        const user = await getUser(id);
        res.json(user);
    } else {
        res.status(400).send('bad request')
    }
}
