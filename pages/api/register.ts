import {NextApiRequest, NextApiResponse} from "next";
import {routeWithIronSession} from "../../lib/session";
import {createUser, getUser} from "../../lib/db/user";
import {setPassword} from "../../lib/db/password";
import {verifyReCaptcha} from "../../lib/utility";
import {generate, validUser} from "../../lib/db/token";
import {userContract} from "../../lib/contract";

async function registerRoute(req: NextApiRequest, res: NextApiResponse) {
    if (await validUser(req)) {
        res.send(req.session.userID);
        return;
    }

    const {id, pwd, nick, token} = req.body;
    if (!id || !pwd || !nick || !userContract.testID(id) || !userContract.testPwd(pwd) || !userContract.testNick(nick)) {
        res.status(400).send('bad request');
        return;
    }

    const validCaptcha = await verifyReCaptcha(token);
    if (!validCaptcha) {
        res.status(400).send('invalid reCaptcha');
        return;
    }

    const existing = await getUser(id);
    if (existing !== null) {
        res.status(409).send('user duplicated');
        return;
    }

    setPassword(id, pwd);
    await createUser(id, nick);
    req.session.userID = id;
    req.session.accessToken = await generate(id);
    await req.session.save();
    res.send('success');
}

export default routeWithIronSession(registerRoute);