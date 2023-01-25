import {GridFSBucket, ObjectId} from "mongodb";
import {db, requireDatabase} from "./database";
import {nanoid} from "nanoid";
import sharp from "sharp";

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
    use?: ImageUse;
}

export interface Image extends ImageMeta {
    stream(): NodeJS.ReadableStream;
}

interface ImageStore extends ImageMeta {
    ref: ObjectId
}

const collectionId = "images"

export async function findImage(id: ImageID): Promise<Image | undefined> {
    requireBucket();
    const meta = await db.collection<ImageStore>(collectionId).findOne({_id: id});
    if (!meta) return undefined;
    if (!await bucket.find({_id: meta.ref}).hasNext()) return undefined;

    return {
        _id: meta._id,
        name: meta.name,
        uploadTime: meta.uploadTime,
        uploader: meta.uploader,
        use: meta.use,
        stream(): NodeJS.ReadableStream {
            return bucket.openDownloadStream(meta.ref);
        },
    };
}

export async function listImages(): Promise<ImageMeta[]> {
    requireDatabase();
    return await db.collection<ImageStore>(collectionId)
        .find()
        .map(v => ({
            _id: v._id,
            name: v.name,
            uploader: v.uploader,
            uploadTime: v.uploadTime,
            use: v.use
        }))
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
 * If an image is used as avatar or blog, it will be deleted once the user's avatar is changed
 * or the post is deleted.
 * @returns {@link AbstractImage} if the upload was successful, or undefined
 * if the database didn't acknowledge
 */
export async function addImage(name: string, uploader: UserID, use: ImageUse | undefined, content: Buffer): Promise<ImageMeta | undefined> {
    requireBucket();

    const dot = name.lastIndexOf(".");
    const identifier = name.substring(0, dot);
    const info: ImageMeta = {
        _id: nanoid(),
        uploader,
        name: identifier,
        uploadTime: new Date(),
        use
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

declare global {
    var imageBucket: GridFSBucket
}