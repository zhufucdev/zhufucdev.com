import { NextApiRequest, NextApiResponse } from 'next'
import { routeWithIronSession } from '../../../lib/session'
import { validUser } from '../../../lib/db/token'
import { getAndCheckUserPermission } from '../../../lib/db/user'
import { addImage, listImages } from '../../../lib/db/image'
import { verifyReCaptcha } from '../../../lib/utility'
import * as multiparty from 'multiparty'
import { IncomingMessage } from 'http'
import { Readable } from 'stream'

async function imagePost(req: NextApiRequest, res: NextApiResponse) {
    const receive = await openImageReceive(req)

    if (!receive) {
        res.status(400).send('bad request');
        return
    }

    try {
        const image = await addImage(
            receive.filename!,
            req.session.userID!,
            receive.use,
            receive.stream,
            receive.target
        )
        if (image) {
            res.send(image._id)
        } else {
            res.status(500).send('database not acknowledging')
        }
    } catch (e) {
        res.status(500).send(e)
    }
}

async function imageGet(req: NextApiRequest, res: NextApiResponse) {
    if (
        !(await getAndCheckUserPermission(req.session.userID!, 'list_images'))
    ) {
        res.status(403).send('not permitted to list images')
        return
    }
    const images = await listImages()
    res.send(images)
}

async function imageRoute(req: NextApiRequest, res: NextApiResponse) {
    if (!req.session.userID || !(await validUser(req))) {
        res.status(401).send('unauthorized')
        return
    }
    if (req.method === 'POST') {
        await imagePost(req, res)
    } else {
        await imageGet(req, res)
    }
}

async function openImageReceive(req: IncomingMessage): Promise<ImageReceive | undefined> {
    const form = new multiparty.Form()
    let token = ''
    let filename = ''
    let stream: Readable | undefined = undefined
    let use: ImageUse | undefined = undefined
    let target: string[] | undefined = undefined

    await new Promise<boolean>((resolve) => {
        function checkIntegrity() {
            if (!token || !filename || !use || !stream) {
                return
            }
            if ((use === 'cover' || use === 'post') && !target) {
                return
            }
            resolve(true)
        }

        form.on('field', (name, value) => {
            switch (name) {
                case 'use':
                    use = value as ImageUse
                    checkIntegrity()
                    break
                case 'token':
                    token = value
                    checkIntegrity()
                    break
                case 'target':
                    target = JSON.parse(value)
                    checkIntegrity()
                    break
            }
        })

        form.on('part', (part) => {
            filename = part.filename
            stream = part
            checkIntegrity()
        })

        form.parse(req)
    })

    if (!(await verifyReCaptcha(token))) {
        return undefined
    }

    return {
        filename, stream: stream!, target: target!, use: use!
    }
}

interface ImageReceive {
    filename: string
    stream: Readable
    use: ImageUse
    target?: string[]
}

export default routeWithIronSession(imageRoute)
export const config = {
    api: {
        bodyParser: false,
    },
}
