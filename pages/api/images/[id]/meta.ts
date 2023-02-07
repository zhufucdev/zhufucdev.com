import {NextApiHandler} from "next";
import {findImage} from "../../../../lib/db/image";

const handler: NextApiHandler = async (req, res) => {
    const {id} = req.query;
    if (!id) {
        res.status(400).send('bad request');
        return
    }
    const image = await findImage(id as string);
    if (!image) {
        res.status(404).send('not found');
        return
    }
    const clientMeta: ImageMetaClient = {
        name: image.name,
        id: image._id,
        uploader: image.uploader,
        uploadTime: image.uploadTime.toISOString(),
        use: image.use
    }
    res.status(200).json(clientMeta);
}

export default handler;