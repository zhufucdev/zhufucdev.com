import { routeWithIronSession } from "../../../../lib/session";
import { validUser } from "../../../../lib/db/token";
import { getUser, User } from "../../../../lib/db/user";
import { hasPermission } from "../../../../lib/contract";
import {
    addComment,
    asCommentable,
    Commentable,
    WithComments,
} from "../../../../lib/db/comment";
import { NextApiResponse } from "next";
import { getDoc } from "../../../../lib/db/get";
import { verifyReCaptcha } from "../../../../lib/utility";
import { postComment } from ".";
import { CommentUtil } from "../../../../lib/comment";

export default routeWithIronSession(async (req, res) => {
    const { type, target } = req.query;
    const commentable = asCommentable(type as string);
    const { body, token } = req.body;
    if (
        !commentable ||
        typeof type !== "string" ||
        typeof target !== "string" ||
        typeof token !== "string" ||
        !body ||
        !CommentUtil.validBody(body)
    ) {
        res.status(400).send("bad request");
        return;
    }
    if (!(await validUser(req))) {
        res.status(401).send("unauthorized");
        return;
    }

    const user = await getUser(req.session.userID!);
    if (!user) {
        res.status(401).send("user removed");
        return;
    }

    if (!(await verifyReCaptcha(token))) {
        res.status(400).send("invalid reCaptcha");
        return;
    }

    await handleCreate(res, commentable, target, user, body.trim());
});

async function handleCreate(
    res: NextApiResponse,
    type: Commentable,
    target: CommentID,
    raiser: User,
    body: string,
) {
    if (!hasPermission(raiser, "comment")) {
        res.status(403).send("forbidden");
        return;
    }

    const doc = await getDoc<WithComments>(type, target);
    if (!doc) {
        res.status(404).send("target article not found");
        return;
    }

    const acknowledged = await addComment(raiser._id, body, doc, type);
    if (acknowledged) {
        postComment(res, acknowledged);
        res.send(acknowledged._id);
    } else {
        res.status(500).send("database not acknowledging");
    }
}
