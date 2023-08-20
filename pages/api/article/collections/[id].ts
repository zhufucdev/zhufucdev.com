import { hasPermission } from '../../../../lib/contract'
import { listCollections } from '../../../../lib/db/article'
import { validUser } from '../../../../lib/db/token'
import { getUser } from '../../../../lib/db/user'
import { routeWithIronSession } from '../../../../lib/session'

export type SpecificCollection = {
    [key: string]: { title: string; containing: boolean }
}

export default routeWithIronSession(async (req, res) => {
    const { id } = req.query
    if (typeof id !== 'string') {
        res.status(400).send('bad request')
        return
    }
    if (!(await validUser(req))) {
        res.status(401).send('unauthorized')
        return
    }

    const user = await getUser(req.session.userID!)
    if (!user) {
        res.status(401).send('user removed')
        return
    }

    if (!hasPermission(user, 'pr_article') && !hasPermission(user, 'modify')) {
        res.status(403).send('forbidden')
        return
    }

    const docs = await listCollections()
    let collections: SpecificCollection = {}
    docs?.forEach(doc => {
        collections[doc._id] = {
            title: doc.title,
            containing: doc.articles.includes(id)
        }
    })
    res.send(collections)
})
