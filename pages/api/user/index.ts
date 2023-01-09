import {NextApiRequest, NextApiResponse} from "next";
import {withIronSessionApiRoute} from "iron-session/next";
import {sessionOptions} from "../../../lib/session";
import {getUser} from "../../../lib/db/user";
import {validToken} from "../../../lib/db/token";

async function userRouter(req: NextApiRequest, res: NextApiResponse) {
    async function clearCookies() {
        req.session.userID = undefined;
        req.session.accessToken = undefined;
        await req.session.save();
    }

    if (!req.session.userID
        || !req.session.accessToken
        || !(await validToken(req.session.accessToken, req.session.userID))) {
        await clearCookies();
        res.send('undefined');
    } else {
        const user = await getUser(req.session.userID);
        if (!user) {
            await clearCookies();
            res.status(401).send('user removed');
        } else {
            res.send(user._id);
        }
    }
}

export default withIronSessionApiRoute(userRouter, sessionOptions);
