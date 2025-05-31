import {NextApiRequest, NextApiResponse} from "next";
import {routeWithIronSession} from "../../lib/session";
import {generate, invalidToken, validUser} from "../../lib/db/token";
import {match} from "../../lib/db/password";
import {verifyReCaptcha} from "../../lib/utility"

async function loginRouter(req: NextApiRequest, res: NextApiResponse) {
    const {logout} = req.body;
    if (await validUser(req)) {
        if (logout) {
            const token = req.session.accessToken!
            req.session.destroy();
            if (!(await invalidToken(token))) {
                res.status(500).send('database not acknowledging');
                return;
            }
            res.send('success');
        } else {
            res.send(req.session.userID);
        }
    } else {
        const {id, pwd, token} = req.body;
        if (!id || !pwd || !token) {
            res.status(400).send('bad reqeust');
            return
        }
        const reCaptchaValid = await verifyReCaptcha(token);
        if (!reCaptchaValid) {
            res.status(400).send('invalid reCaptcha');
            return
        }
        const pwdMatch = await match(id, pwd);
        if (!pwdMatch) {
            res.status(401).send('password mismatch');
        } else {
            req.session.userID = id;
            req.session.accessToken = await generate(id);
            await req.session.save();
            res.send(req.session.userID);
        }
    }
}

export default routeWithIronSession(loginRouter);