import {withIronSessionApiRoute} from "iron-session/next";
import {NextApiRequest, NextApiResponse} from "next";
import {sessionOptions} from "../../lib/session";
import {createUser, getUser} from "../../lib/db/user";
import {setPassword} from "../../lib/db/password";

async function registerRoute(req: NextApiRequest, res: NextApiResponse) {
    const {id, pwd, nick} = req.body;
    if (!id || !pwd || !nick) {
        res.status(400).send('bad request');
        return;
    }

    const existing = await getUser(id);
    if (existing !== null) {
        res.status(409).send('user duplicated');
        return;
    }

    createUser(id, nick);
    await setPassword(id, pwd);
    res.send('success');
}

export default withIronSessionApiRoute(registerRoute, sessionOptions);