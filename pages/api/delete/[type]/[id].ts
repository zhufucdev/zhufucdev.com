import {routeWithIronSession} from "../../../../lib/session";
import {validUser} from "../../../../lib/db/token";
import {canDrop, drop, Droppable} from "../../../../lib/db/drop";
import {NextApiResponse} from "next";
import {notifyTargetDropped} from "../../../../lib/db/image";
import {Comment} from "../../../../lib/db/comment";

export default routeWithIronSession(async (req, res) => {
    const {type, id} = req.query;
    if (typeof id !== 'string' || typeof type !== 'string') {
        res.status(400).send('bad request');
        return
    }

    if (!await validUser(req)) {
        res.status(401).send('unauthorized');
        return
    }

    if (canDrop(type)) {
        const {acknowledged, permitted, original} = await drop(type as Droppable, id, req.session.userID!);
        if (acknowledged) {
            res.send('success');
            postDrop(type as Droppable, original!, id, res);
        } else if (permitted) {
            res.status(500).send('database not acknowledging')
        } else {
            res.status(403).send('forbidden')
        }
    } else {
        res.status(400).send(`${type} is undroppable`);
    }
});

async function postDrop(type: Droppable, dropped: any, id: any, res: NextApiResponse) {
    await notifyTargetDropped(id);
    switch (type) {
        case "articles":
            await res.revalidate('/article');
            break;
        case "recents":
            await res.revalidate('/inspiration');
            break;
        case "comments":
            const comment = dropped as Comment
            if (comment.parent) {
                switch (comment.parentType) {
                    case "articles":
                        await res.revalidate(`/article/${comment.parent}`);
                        break;
                    case "comments":
                        await res.revalidate(`/comment/${comment.parent}`);
                        break
                }
            }
            break;
        case "inspirations":
            await res.revalidate('/');
    }
}