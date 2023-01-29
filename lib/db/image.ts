import {GridFSBucket, ObjectId, WithId} from "mongodb";
import {db, requireDatabase} from "./database";
import {nanoid} from "nanoid";
import sharp from "sharp";
import {getUser} from "./user";

let bucket = globalThis.imageBucket;

function requireBucket(): GridFSBucket {
    requireDatabase();
    if (!globalThis.imageBucket) {
        bucket = new GridFSBucket(db, {bucketName: "images"});
        globalThis.imageBucket = bucket;
    }
    return bucket;
}

export interface ImageMeta {
    _id: ImageID;
    name: string;
    uploadTime: Date;
    uploader: UserID;
    use: ImageUse;
    target?: any[];
}

export interface Image extends ImageMeta {
    stream(): NodeJS.ReadableStream;
}

interface ImageStore extends ImageMeta {
    ref: ObjectId
}

const collectionId = "images"

function tranformer(store: ImageStore): ImageMeta {
    return {
        _id: store._id,
        name: store.name,
        uploader: store.uploader,
        uploadTime: store.uploadTime,
        use: store.use ?? 'save',
        ...(store.use === 'post' || store.use === 'cover' ? {target: store.target ?? []} : {})
    }
}

export async function findImage(id: ImageID): Promise<Image | undefined> {
    requireBucket();
    const meta = await db.collection<ImageStore>(collectionId).findOne({_id: id});
    if (!meta) return undefined;
    if (!await bucket.find({_id: meta.ref}).hasNext()) return undefined;

    return {
        ...tranformer(meta),
        stream(): NodeJS.ReadableStream {
            return bucket.openDownloadStream(meta.ref);
        },
    };
}

export async function listImages(): Promise<ImageMeta[]> {
    requireDatabase();
    return await db.collection<ImageStore>(collectionId)
        .find()
        .map(tranformer)
        .toArray()
}

/**
 * Upload a file as image to the database, converting it to webp format
 * @param name the file name, where letters before "."
 * is used as image name, and the extension is used for
 * converting
 * @param content the file buffer
 * @param uploader who uploads
 * @param use how the image should be used.
 * If an image is used as avatar or cover, it will be deleted once the user's avatar is changed
 * , the post is deleted or its cover is replaced.
 * @param target only present when {@link use} is set to 'post' or 'cover',
 * indicating what posts is this image attached to.
 * @returns {@link AbstractImage} if the upload was successful, or undefined
 * if the database didn't acknowledge
 */
export async function addImage(
    name: string,
    uploader: UserID,
    use: ImageUse = 'save',
    content: Buffer,
    target: string[] = []
): Promise<ImageMeta | undefined> {
    requireBucket();
    removeRedundancy(uploader, use, target);

    const dot = name.lastIndexOf(".");
    const identifier = name.substring(0, dot);
    const info: ImageMeta = {
        _id: nanoid(),
        uploader,
        name: identifier,
        uploadTime: new Date(),
        use,
        ...(use === 'post' || use === 'cover' ? {target} : {})
    }

    const ref = new ObjectId();
    const stream = bucket.openUploadStreamWithId(ref, name);
    sharp(content).webp({quality: 80}).pipe(stream, {end: true});

    return new Promise((resolve, reject) => {
        stream.on('error', reject);
        stream.on('finish', () => {
            const image: ImageStore = {...info, ref};
            db.collection<ImageStore>(collectionId).insertOne(image).then(({acknowledged}) => {
                if (acknowledged) resolve(info);
            })
        });
    })
}

/**
 * Delete an image, removing all files and links
 * @param id the target image
 * @returns whether the removal was successful
 */
export async function removeImage(id: ImageID): Promise<boolean> {
    requireBucket();
    const images = db.collection<ImageStore>(collectionId)
    const meta = await images.findOne({_id: id});
    if (!meta) return false;
    await imageBucket.delete(meta.ref);
    const res = await images.findOneAndDelete({_id: id});
    return res.ok === 1;
}

/**
 * Make an image target something
 * @param id the image
 * @param target the thing
 * @returns whether the database acknowledged
 * @see addImage
 */
export async function attachImage(id: ImageID, target: any): Promise<boolean> {
    requireDatabase();
    const res = await db.collection<ImageStore>(collectionId).findOneAndUpdate({_id: id}, {$push: {target}});
    return res.ok === 1;
}

export async function detachImage(id: ImageID, target: any): Promise<boolean> {
    requireDatabase();
    const res = await db.collection<ImageStore>(collectionId).findOneAndUpdate({_id: id}, {$pull: {target}});
    return res.ok === 1;
}

/**
 * Helps the {@link addImage} work
 */
async function removeRedundancy(uploader: UserID, use: ImageUse, target: string[]) {
    switch (use) {
        case "avatar":
            const user = await getUser(uploader);
            const avatar = user?.avatar;
            if (avatar && (await findImage(avatar))?.use === 'avatar') {
                await removeImage(avatar);
            }
            break;
        case "cover":
            const coll = db.collection<ImageStore>(collectionId);
            await coll.deleteMany({target});
    }
}

/**
 * Declare that some post has been deleted
 * @param target the post
 * @see addImage
 */
export async function notifyTargetDropped(target: string) {
    requireDatabase();
    const coll = db.collection<ImageStore>(collectionId);
    const droppable = ['avatar', 'cover', 'post'];
    await (await listImages()).forEach((meta) => {
        if (droppable.includes(meta.use)
            && meta.target?.includes(target) === true
            && meta.target.length === 1)
            removeImage(meta._id);
    });

    await coll.updateMany({
        $where: function () {
            return this.target?.includes(target) === true
        }
        // @ts-ignore
    }, {$pull: {target: target}})
}

declare global {
    var imageBucket: GridFSBucket
}