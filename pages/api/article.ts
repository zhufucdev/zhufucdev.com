import {routeWithIronSession} from "../../lib/session";
import {validUser} from "../../lib/db/token";
import {getUser} from "../../lib/db/user";
import {hasPermission} from "../../lib/contract";
import {verifyReCaptcha} from "../../lib/utility";
import {addArticle, ArticleUpdate, getArticle, updateArticle} from "../../lib/db/article";
import {validRef} from "./begin/[type]";
import {attachImage, detachImage} from "../../lib/db/image";

export default routeWithIronSession(async (req, res) => {
    if (!await validUser(req)) {
        res.status(401).send('unauthorized');
        return
    }
    const user = await getUser(req.session.userID!);
    if (!user) {
        res.status(403).send('user removed');
        return
    }
    if (!hasPermission(user, 'post_article')) {
        res.status(403).send('forbidden');
        return
    }

    const {token, ref, title, forward, body, cover} = req.body;
    if (!validRef(ref, 'articles') && (!req.body.edit)) {
        res.status(403).send('ref forbidden');
        return
    }
    if (!await verifyReCaptcha(token)) {
        res.status(400).send('invalid reCaptcha');
        return
    }

    if (!req.body.edit) {
        if (typeof title !== 'string'
            || typeof forward !== 'string'
            || (cover && typeof cover !== 'string')
            || typeof body !== 'string') {
            res.status(400).send('bad request');
            return
        }
        const meta = await addArticle(ref, req.session.userID!, title, cover, forward, body);
        if (meta) {
            res.revalidate('/article');
            res.send(meta._id)
        } else {
            res.status(500).send('database not acknowledging')
        }
    } else {
        const original = await getArticle(ref);
        if (!original) {
            res.status(404).send('not found');
            return
        }
        if (!hasPermission(user, 'modify')) {
            if (!hasPermission(user, 'edit_own_post') || original.author !== req.session.userID) {
                res.status(403).send('not permitted');
                return
            }
        }

        if (!ref || !title && !forward && !body && !cover) {
            res.status(400).send('bad request');
            return
        }

        if (cover && original.cover !== cover) {
            // relink image
            original.cover && detachImage(original.cover, ref);
            attachImage(cover, ref);
        }

        const update: ArticleUpdate = {
            title, forward, body, cover
        }
        for (let key in update) {
            if (!(update as any)[key]) {
                delete (update as any)[key]
            }
        }
        const acknowledged = await updateArticle(ref, update);
        if (acknowledged) {
            res.revalidate('/article');
            res.revalidate(`/article/${ref}`);
            res.send('success');
        } else {
            res.status(500).send('database not acknowledging')
        }
    }
})