import {NextApiHandler} from "next";
import {validToken} from "../../../lib/db/token";

const handler: NextApiHandler = async (req, res) => {
    const {id, token} = req.body;
    if (!id || !token) {
        res.status(400).send('bad request');
        return
    }
    return res.send({valid: await validToken(token, id)});
}

export default handler;