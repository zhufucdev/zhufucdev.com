import { validUser } from '../../../lib/db/token'
import { serializedMdx } from '../../../lib/mdxUtility'
import { routeWithIronSession } from '../../../lib/session'
import { verifyReCaptcha } from '../../../lib/utility'

export default routeWithIronSession(async (req, res) => {
    const { token, content } = req.body
    if (!(await validUser(req))) {
        res.status(401).send('unauthorized')
        return
    }

    if (!(await verifyReCaptcha(token))) {
        res.status(400).send('invalid reCaptcha')
        return
    }

    try {
        res.send(await serializedMdx(content))
    } catch (e: any) {
        res.status(400).send(e.message)
    }
})
