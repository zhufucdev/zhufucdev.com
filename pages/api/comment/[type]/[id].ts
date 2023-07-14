import {routeWithIronSession} from "../../../../lib/session";
import {validUser} from "../../../../lib/db/token";
import {getUser} from "../../../../lib/db/user";
import {hasPermission} from "../../../../lib/contract";
import {addComment, asCommentable, Commentable} from "../../../../lib/db/comment";
import {getArticle} from "../../../../lib/db/article";
import {NextApiResponse} from "next";

export default routeWithIronSession(async (req, res) => {
    const {type, id} = req.query;
    const commentable = asCommentable(type as string);
    if (!commentable || typeof id !== 'string') {
        res.status(400).send('bad request');
        return
    }

    if (!await validUser(req)) {
        res.status(401).send('unauthorized');
        return
    }
    const user = await getUser(req.session.userID!);
    if (!user) {
        res.status(401).send('user removed');
        return
    }
    if (hasPermission(user, 'comment')) {
        res.status(403).send('forbidden');
        return
    }

    const target = await getArticle(id);
    if (!target) {
        res.status(404).send('target article not found');
        return
    }

    const acknowledged = await addComment(user._id, req.body, target, commentable);
    if (acknowledged) {
        postComment(res, commentable, target._id);
        res.send(acknowledged._id);
    } else {
        res.status(500).send('database not acknowledging')
    }
});

async function postComment(res: NextApiResponse, type: Commentable, id: string) {
    switch (type) {
        case "articles":
            await res.revalidate(`/articles/${id}`)
    }
}