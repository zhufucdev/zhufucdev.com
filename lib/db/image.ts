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
            uploadTime: v.uploadTime
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
 * @returns {@link AbstractImage} if the upload was successful, or undefined
 * if the database didn't acknowledge
 */
export async function addImage(name: string, uploader: UserID, content: Buffer): Promise<ImageMeta | undefined> {
    requireBucket();

    const dot = name.lastIndexOf(".");
    const identifier = name.substring(0, dot);
    const info: ImageMeta = {
        _id: nanoid(),
        uploader,
        name: identifier,
        uploadTime: new Date()
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

declare global {
    var imageBucket: GridFSBucket
}