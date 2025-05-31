import {routeWithIronSession} from "../../../lib/session";
import {validUser} from "../../../lib/db/token";
import {ArticleUtil, listArticles} from "../../../lib/db/article";
import {getUser} from "../../../lib/db/user";
import {getSafeArticle} from "../../../lib/safeArticle";

export default routeWithIronSession(async (req, res) => {
    if (!(await validUser(req))) {
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
            .filter(ArticleUtil.proceedingFor(user))
            .map(getSafeArticle)
    res.send(filtered)
});