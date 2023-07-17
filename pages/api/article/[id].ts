import {NextApiHandler} from "next";
import {getArticle} from "../../../lib/db/article";
import {getSafeArticle} from "../../../lib/getSafeArticle";

const handler: NextApiHandler = async (req, res) => {
    const {id} = req.query;
    if (typeof id !== 'string') {
        res.status(400).send('bad request');
        return
    }
    const meta = await getArticle(id);
    if (!meta) {
        res.status(404).send('not found');
        return
    }

    res.send(getSafeArticle(meta))
}

export default handler;