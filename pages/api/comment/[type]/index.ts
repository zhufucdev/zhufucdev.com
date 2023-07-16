import { NextApiResponse } from "next";
import { hasPermission } from "../../../../lib/contract";
import {
    Commentable,
    getComment,
    updateComment,
} from "../../../../lib/db/comment";
import { validUser } from "../../../../lib/db/token";
import { getUser, User } from "../../../../lib/db/user";
import { routeWithIronSession } from "../../../../lib/session";
import { verifyReCaptcha } from "../../../../lib/utility";

export default routeWithIronSession(async (req, res) => {
    const { type: target } = req.query;
    const { body, token } = req.body;
    if (typeof target !== "string" || typeof token !== "string" || !body) {
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

    await handleEdit(res, target, user, body);
});

async function handleEdit(
    res: NextApiResponse,
    target: CommentID,
    raiser: User,
    body: string,
) {
    const origin = await getComment(target);
    if (!origin) {
        res.status(404).send("not found");
        return;
    }
    if (
        !hasPermission(raiser, "modify") &&
        (!hasPermission(raiser, "edit_own_post") ||
            origin.raiser !== raiser._id)
    ) {
        console.log("origin", origin.raiser, "raiser", raiser._id);
        res.status(403).send("forbidden");
        return;
    }

    const acknowledged = await updateComment(target, { body, edited: true });
    if (acknowledged) {
        res.send("success");
    } else {
        res.status(500).send("database not acknowledging");
    }
}

export async function postComment(
    res: NextApiResponse,
    type: Commentable,
    id: string,
) {
    switch (type) {
        case "articles":
            await res.revalidate(`/articles/${id}`);
    }
}