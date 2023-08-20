import { NextApiHandler } from 'next'
import { getCollection } from '../../../../../lib/db/article'
import { getSafeArticle, SafeArticle } from '../../../../../lib/safeArticle'

const handler: NextApiHandler = async (req, res) => {
    const { container, id } = req.query
    const collection = await getCollection(container as string)
    if (!collection) {
        res.status(404).send('collection not found')
        return
    }

    const props: any = { collection: collection.title }
    let found = false
    let previous: SafeArticle | undefined = undefined
    let next: SafeArticle | undefined = undefined
    for await (const article of collection) {
        if (!found && id === article._id) {
            found = true
        } else if (found) {
            next = getSafeArticle(article)
            break
        } else {
            previous = getSafeArticle(article)
        }
    }
    if (found) {
        props.previous = previous
        props.next = next
    }
    res.send(props)
}

export default handler
