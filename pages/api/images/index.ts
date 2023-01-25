import {NextApiRequest, NextApiResponse} from "next";
import {routeWithIronSession} from "../../../lib/session";
import {validUser} from "../../../lib/db/token";
import {getAndCheckUserPermission, getUser} from "../../../lib/db/user";
import {addImage, findImage, listImages, removeImage} from "../../../lib/db/image";
import * as multipart from "parse-multipart-data";
import {readAll, verifyReCaptcha} from "../../../lib/utility";

async function imagePost(req: NextApiRequest, res: NextApiResponse) {
    const boundary = multipart.getBoundary(req.headers["content-type"]!);
    const form = multipart.parse(await readAll(req), boundary);
    const file = form[0];
    const token = form[1].data.toString();
    const use = form[2].data.toString() as ImageUse;
    if (!use) {
        res.status(400).send('bad request');
        return
    }
    if (!await verifyReCaptcha(token)) {
        res.status(403).send('invalid reCaptcha');
        return
    }
    try {
        const image = await addImage(file.filename!, req.session.userID!, use, file.data);
        if (image) {
            if (use === 'avatar') {
                // remove redundant image
                const user = await getUser(req.session.userID!);
                const avatar = user?.avatar;
                if (avatar && (await findImage(avatar))?.use === 'avatar') {
                    removeImage(avatar);
                }
            }
            res.send(image._id)
        } else {
            res.status(500).send('database not acknowledging')
        }
    } catch (e) {
        res.status(500).send(e)
    }
}

async function imageGet(req: NextApiRequest, res: NextApiResponse) {
    if (!await getAndCheckUserPermission(req.session.userID!, "list_images")) {
        res.status(403).send('not permitted to list images');
        return;
    }
    const images = await listImages();
    res.send(images)
}

async function imageRoute(req: NextApiRequest, res: NextApiResponse) {
    if (!req.session.userID || !await validUser(req)) {
        res.status(401).send('unauthorized');
        return
    }
    if (req.method === "POST") {
        await imagePost(req, res)
    } else {
        await imageGet(req, res)
    }
}

export default routeWithIronSession(imageRoute);
export const config = {
    api: {
        bodyParser: false
    }
}