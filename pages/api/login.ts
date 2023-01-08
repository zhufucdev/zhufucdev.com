import {NextApiRequest, NextApiResponse} from "next";
import {withIronSessionApiRoute} from "iron-session/next";
import {sessionOptions} from "../../lib/session";
import {generate, valid} from "../../lib/db/token";
import {match} from "../../lib/db/password";

async function verifyReCaptcha(token: string): Promise<boolean> {
    const secret = process.env.RECAPTCHA_KEY_BACKEND;
    const res = await fetch(
        `https://www.google.com/recaptcha/api/siteverify?secret=${secret}&response=${token}`,
        {method: 'POST'}
    );
    const json = await res.json();
    return json.success;
}

async function loginRouter(req: NextApiRequest, res: NextApiResponse) {
    if (req.session.userID && req.session.accessToken && await valid(req.session.accessToken, req.session.userID)) {
        res.send(req.session.userID);
    } else {
        const {id, pwd, token} = req.body;
        if (!id || !pwd || !token) {
            res.status(400).send('bad reqeust');
            return
        }
        const reCaptchaValid = await verifyReCaptcha(token);
        if (!reCaptchaValid) {
            res.status(400).send('invalid ReCaptcha');
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

export default withIronSessionApiRoute(loginRouter, sessionOptions);