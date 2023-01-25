import {NextApiRequest, NextApiResponse} from "next";
import {routeWithIronSession} from "../../../lib/session";
import {getUser, modifyUser, UserProfile} from "../../../lib/db/user";
import {validToken} from "../../../lib/db/token";
import {userContract} from "../../../lib/contract";
import {findImage} from "../../../lib/db/image";

async function clearCookies(req: NextApiRequest) {
    req.session.userID = undefined;
    req.session.accessToken = undefined;
    await req.session.save();
}

async function userGet(req: NextApiRequest, res: NextApiResponse) {
    const user = await getUser(req.session.userID!);
    if (!user) {
        await clearCookies(req);
        res.status(401).send('user removed');
    } else {
        res.send(user._id);
    }
}

async function userSet(req: NextApiRequest, res: NextApiResponse) {
    const {nick, biography, avatar} = req.body;
    if (!nick && !biography && !avatar
        || biography && (typeof biography !== 'string'
        || biography.trim().length > userContract.maxBioLen)
        || avatar && !(await findImage(avatar))) {
        res.status(400).send('bad request');
        return
    }

    const original = await getUser(req.session.userID!);
    if (!original) {
        await clearCookies(req);
        res.status(401).send('user removed');
        return
    }

    const mod: UserProfile = {nick, biography, avatar}
    if (!nick || nick === original.nick) {
        delete mod.nick
    }
    if (!biography || biography === original.biography) {
        delete mod.biography
    }
    if (!avatar || avatar === original.avatar) {
        delete mod.avatar
    }

    const acknowledged = await modifyUser(original._id, mod);
    if (acknowledged) {
        res.send('success')
    } else {
        res.status(500).send('database not acknowledged')
    }
}

async function userRouter(req: NextApiRequest, res: NextApiResponse) {
    if (!req.session.userID
        || !req.session.accessToken
        || !(await validToken(req.session.accessToken, req.session.userID))) {
        await clearCookies(req);
        res.send('undefined');
    } else {
        if (req.method === 'POST') {
            await userSet(req, res);
        } else {
            await userGet(req, res);
        }
    }
}

export default routeWithIronSession(userRouter);
