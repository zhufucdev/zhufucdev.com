import {routeWithIronSession} from "../../../../lib/session";
import {mergeWith, RemarkMode} from "../../../../lib/db/remark";
import {getUser} from "../../../../lib/db/user";
import {validUser} from "../../../../lib/db/token";
import {hasPermission} from "../../../../lib/contract";
import {getInspiration} from "../../../../lib/db/inspiration";
import {verifyReCaptcha} from "../../../../lib/utility";

export default routeWithIronSession(async (req, res) => {
    const {id, mode} = req.query;
    const {token} = req.body;

    if (!id || !mode || !token) {
        res.status(400).send('bad request');
        return
    }

    if (!await verifyReCaptcha(token)) {
        res.status(403).send('invalid reCAPTCHA');
        return
    }

    if (!await validUser(req)) {
        res.status(403).send('not logged in');
        return
    }

    const user = await getUser(req.session.userID!);
    if (!user) {
        res.status(403).send('user removed');
        return
    }

    const post = await getInspiration(id as InspirationID);
    if (!post) {
        res.status(404).send('post not found');
        return
    }

    try {
        let success = false;
        if (mode === 'archive' || mode === 'unarchive') {
            if (!hasPermission(user, 'modify')) {
                if (!hasPermission(user, 'edit_own_post') || post.raiser !== user._id) {
                    res.status(403).send('forbidden');
                    return
                }
            }

            success = await mergeWith(
                'inspirations', id, 'archive', req.session.userID!,
                mode === 'archive' ? 'archived' : 'none'
            );
        } else {
            if (!hasPermission(user, 'modify')) {
                res.status(403).send('forbidden');
                return
            }

            success = await mergeWith('inspirations', id, 'flag', req.session.userID!, mode as RemarkMode);
        }
        if (success) {
            res.revalidate('/');
            res.revalidate('/inspiration');
            res.send('success')
        } else {
            res.status(500).send('database not acknowledging')
        }
    } catch (e: any) {
        res.status(500).send(e?.message ?? e);
    }
});