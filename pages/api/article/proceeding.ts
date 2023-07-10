import {routeWithIronSession} from "../../../lib/session";
import {validUser} from "../../../lib/db/token";
import {listArticles} from "../../../lib/db/article";
import {readTags} from "../../../lib/tagging";
import {getUser} from "../../../lib/db/user";
import {hasPermission} from "../../../lib/contract";
import {getSafeArticle} from "../../../lib/getSafeArticle";

export default routeWithIronSession(async (req, res) => {
    if (!await validUser(req)) {
        res.status(401).send('unauthorized');
        return
    }
    const user = await getUser(req.session.userID!);
    if (!user) {
        res.status(403).send('user removed');
        return
    }
    const filtered =
        (await listArticles())
            .filter(v => readTags(v).hidden && (v.author === user._id || hasPermission(user, 'modify')))
            .map(getSafeArticle)
    res.send(filtered)
});