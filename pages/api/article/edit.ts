import { routeWithIronSession } from '../../../lib/session'
import { validUser } from '../../../lib/db/token'
import { getUser } from '../../../lib/db/user'
import { hasPermission } from '../../../lib/contract'
import { readAll, verifyReCaptcha } from '../../../lib/utility'
import {
    addArticle,
    ArticleMeta,
    ArticleUpdate,
    duplicateArticle,
    getArticle,
    updateArticle,
    updateArticleInCollection,
} from '../../../lib/db/article'
import { notifyTargetDuplicated } from '../../../lib/db/image'
import { nanoid } from 'nanoid'
import {
    checkTagsIntegrity,
    readTags,
    stringifyTags,
} from '../../../lib/tagging'

export default routeWithIronSession(async (req, res) => {
    if (!(await validUser(req))) {
        res.status(401).send('unauthorized')
        return
    }
    const user = await getUser(req.session.userID!)
    if (!user) {
        res.status(401).send('user removed')
        return
    }
    let { token, title, forward, body, cover, tags, collections } = req.body
    let ref = req.body.ref

    if (!(await verifyReCaptcha(token))) {
        res.status(400).send('invalid reCaptcha')
        return
    }
    // to modify
    const original = await getArticle(ref)
    if (!original) {
        res.status(404).send('not found')
        return
    }
    const canModify = hasPermission(user, 'modify')
    const canEdit =
        canModify ||
        (hasPermission(user, 'edit_own_post') &&
            original.author == req.session.userID)
    const canPr =
        hasPermission(user, 'pr_article') &&
        original.author !== req.session.userID

    if (!canEdit && !canPr) {
        res.status(403).send('not permitted')
        return
    }

    if (!ref || (!title && !forward && !body && !cover && !tags)) {
        res.status(400).send('bad request')
        return
    }

    const update: ArticleUpdate = {
        title,
        forward,
        body,
        cover,
        tags,
    }
    const tagStruct = Array.isArray(tags) ? readTags(tags) : {}

    if (!checkTagsIntegrity(tagStruct)) {
        res.status(400).send('tag is invalid')
        return
    }

    if (canEdit) {
        const prFrom = tagStruct['pr-from']

        // to modify one's own stuff or to administrate
        if (tagStruct['t-from'] && !original.tags['t-from'] && !prFrom) {
            // to add a new translation
            const origin = await getArticle(tagStruct['t-from'] as string)
            if (!origin) {
                res.status(404).send('origin not found')
                return
            }
            const copy = await duplicateArticle(origin._id)
            if (!copy) {
                res.status(500).send('failed to duplicate doc')
                return
            }
            ref = copy._id
        }

        if (!canModify) {
            // modifying one's own pull request
            if (!prFrom) {
                res.status(403).send('not permitted')
                return
            }
            tagStruct['pr-from'] = prFrom
            tagStruct.private = true
            update.tags = stringifyTags(tagStruct)
        } else if (prFrom && !tagStruct.private && !tagStruct['t-from']) {
            // merging the pr
            update._id = prFrom as string
        }

        for (let key in update) {
            if (!(update as any)[key]) {
                delete (update as any)[key]
            }
        }

        const acknowledged = await updateArticle(ref, update)
        if (acknowledged) {
            res.revalidate('/')
            res.revalidate(`/article/${ref}`)
            let involved: ArticleID[] = [ref]
            if (update._id) {
                involved.push(update._id)
                involved = involved.concat(
                    await updateArticleInCollection(update._id, collections)
                )
            } else {
                involved = involved.concat(
                    await updateArticleInCollection(ref, collections)
                )
            }
            if (tagStruct['t-from']) {
                involved.push(tagStruct['t-from'] as string)
            }
            for (const id of involved) {
                res.revalidate(`/article/${id}`)
            }
            await res.revalidate('/article')
            res.send('success')
        } else {
            res.status(500).send('database not acknowledging')
        }
    } else if (canPr) {
        // to create a pull request
        if (!Array.isArray(tags)) {
            res.status(400).send('bad request')
            return
        }

        let pr: ArticleMeta = {
            ...original,
            author: req.session.userID!,
            _id: nanoid(),
        }
        for (const key in update) {
            // @ts-ignore
            if (update[key]) {
                // @ts-ignore
                pr[key] = update[key]
            }
        }
        if (!body) {
            body = await readAll(original.stream())
        }

        const meta = await addArticle(
            pr._id,
            pr.author,
            pr.title,
            pr.cover,
            pr.forward,
            body,
            stringifyTags({
                ...tagStruct,
                'pr-from': original._id,
                private: true,
            })
        )
        notifyTargetDuplicated(original._id, pr._id)
        if (meta) {
            if (collections) {
                for (const involved of await updateArticleInCollection(
                    pr._id,
                    collections
                )) {
                    res.revalidate(`/article/${involved}`)
                }
            }
            res.send(meta._id)
        } else {
            res.status(500).send('database not acknowledging')
        }
    }
})
