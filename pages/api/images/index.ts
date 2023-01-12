import {NextApiRequest, NextApiResponse} from "next";
import {routeWithIronSession} from "../../../lib/session";
import {validUser} from "../../../lib/db/token";
import {getAndCheckUserPermission} from "../../../lib/db/user";
import {addImage, listImages} from "../../../lib/db/image";
import * as multipart from "parse-multipart-data";
import {readAll} from "../../../lib/utility";

async function imageRoute(req: NextApiRequest, res: NextApiResponse) {
    if (!req.session.userID || !await validUser(req)) {
        res.status(401).send('unauthorized');
        return;
    }
    if (!await getAndCheckUserPermission(req.session.userID, "list_images")) {
        res.status(403).send('not permitted to list images');
        return;
    }
    if (req.method === "GET") {
        const images = await listImages();
        res.send(images);
    } else if (req.method === "POST") {
        const ct = req.headers["content-type"]!;
        const boundary = ct.substring(ct.indexOf("boundary=") + 9);
        const form = multipart.parse(await readAll(req), boundary);
        const file = form[0];
        try {
            const image = await addImage(file.filename!, req.session.userID, file.data);
            if (image) {
                res.send(image._id);
            } else {
                res.status(500).send('database not acknowledging');
            }
        } catch (e) {
            res.status(500).send(e);
        }
    }
}

export default routeWithIronSession(imageRoute);
export const config = {
    api: {
        bodyParser: false
    }
}