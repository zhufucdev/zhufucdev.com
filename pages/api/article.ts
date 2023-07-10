import {routeWithIronSession} from "../../lib/session";
import {validUser} from "../../lib/db/token";
import {getUser} from "../../lib/db/user";
import {hasPermission} from "../../lib/contract";
import {readAll, verifyReCaptcha} from "../../lib/utility";
import {addArticle, ArticleMeta, ArticleUpdate, getArticle, updateArticle} from "../../lib/db/article";
import {validRef} from "./begin/[type]";
import {notifyTargetDuplicated} from "../../lib/db/image";
import {nanoid} from "nanoid";
import {readTags, stringifyTags} from "../../lib/tagging";

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
    let {token, title, forward, body, cover, tags} = req.body;
    let ref = req.body.ref;

    if (!validRef(ref, 'articles') && (!req.body.edit)) {
        res.status(403).send('ref forbidden');
        return
    }
    if (!await verifyReCaptcha(token)) {
        res.status(400).send('invalid reCaptcha');
        return
    }
    if (!req.body.edit) {
        // to create
        if (!hasPermission(user, 'post_article')) {
            res.status(403).send('forbidden');
            return
        }

        if (typeof title !== 'string'
            || typeof forward !== 'string'
            || (cover && typeof cover !== 'string')
            || typeof body !== 'string'
            || !Array.isArray(tags)) {
            res.status(400).send('bad request');
            return
        }
        const meta = await addArticle(ref, req.session.userID!, title, cover, forward, body, readTags({tags}));
        if (meta) {
            await res.revalidate('/article');
            await res.revalidate('/');
            res.send(meta._id)
        } else {
            res.status(500).send('database not acknowledging')
        }
    } else {
        // to modify
        const original = await getArticle(ref);
        if (!original) {
            res.status(404).send('not found');
            return
        }
        const canModify = hasPermission(user, 'modify');
        const canEdit =
            canModify || hasPermission(user, 'edit_own_post') && original.author == req.session.userID;
        const canPr = hasPermission(user, 'pr_article')
            && original.author !== req.session.userID;

        if (!canEdit && !canPr) {
            res.status(403).send('not permitted');
            return
        }

        if (!ref || !title && !forward && !body && !cover && !tags) {
            res.status(400).send('bad request');
            return
        }

        const update: ArticleUpdate = {
            title, forward, body, cover, tags
        }

        if (canEdit) {
            // to modify one's own stuff or to administrate
            if (Array.isArray(tags)) {
                const restructured = readTags({tags});
                const prFrom = restructured["pr-from"];
                if (!canModify) {
                    // modifying one's own pull request
                    if (!prFrom) {
                        res.status(403).send('not permitted');
                        return
                    }
                    restructured["pr-from"] = prFrom;
                    restructured.hidden = true;
                    update.tags = stringifyTags(restructured);
                } else if (prFrom && !restructured.hidden) {
                    // merging the pr
                    update._id = prFrom as string;
                    update.author = (await getArticle(prFrom as string))?.author;
                }
            }

            for (let key in update) {
                if (!(update as any)[key]) {
                    delete (update as any)[key]
                }
            }

            const acknowledged = await updateArticle(ref, update);
            if (acknowledged) {
                res.revalidate(`/article/${ref}`);
                res.revalidate(`/article/${update._id}`);
                await res.revalidate('/article');
                await res.revalidate('/')
                res.send('success');
            } else {
                res.status(500).send('database not acknowledging')
            }
        } else if (canPr) {
            // to create a pull request
            if (!Array.isArray(tags)) {
                res.status(400).send('bad request');
                return
            }
            const tagStruct = readTags({tags});

            let pr: ArticleMeta = {...original, author: req.session.userID!, _id: nanoid()};
            for (const key in update) {
                // @ts-ignore
                if (update[key]) {
                    // @ts-ignore
                    pr[key] = update[key];
                }
            }
            if (!body) {
                body = await readAll(original.stream());
            }

            const meta =
                await addArticle(pr._id, pr.author, pr.title, pr.cover, pr.forward, body, {
                    ...tagStruct,
                    'pr-from': original._id,
                    'hidden': true
                });
            notifyTargetDuplicated(original._id, pr._id);
            if (meta) {
                res.send(meta._id)
            } else {
                res.status(500).send('database not acknowledging')
            }
        }
    }
})

