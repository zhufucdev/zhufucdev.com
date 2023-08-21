import { routeWithIronSession } from '../../../lib/session'
import { validUser } from '../../../lib/db/token'
import { getUser } from '../../../lib/db/user'
import { hasPermission } from '../../../lib/contract'
import { getArticleUri, verifyReCaptcha } from '../../../lib/utility'
import { addArticle, updateArticleInCollection } from '../../../lib/db/article'
import { validRef } from '../begin/[type]'

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

    if (!validRef(ref, 'articles')) {
        res.status(403).send('ref forbidden')
        return
    }
    if (!(await verifyReCaptcha(token))) {
        res.status(400).send('invalid reCaptcha')
        return
    }
    // to create
    if (!hasPermission(user, 'post_article')) {
        res.status(403).send('forbidden')
        return
    }

    if (
        typeof title !== 'string' ||
        typeof forward !== 'string' ||
        (cover && typeof cover !== 'string') ||
        typeof body !== 'string' ||
        !Array.isArray(tags)
    ) {
        res.status(400).send('bad request')
        return
    }
    const meta = await addArticle(
        ref,
        req.session.userID!,
        title,
        cover,
        forward,
        body,
        tags
    )
    if (meta) {
        res.revalidate('/')
        if (collections) {
            for (const involved of await updateArticleInCollection(ref, collections)) {
                res.revalidate(getArticleUri(involved))
            }
        }
        await res.revalidate('/article')
        res.send(meta._id)
    } else {
        res.status(500).send('database not acknowledging')
    }
})
