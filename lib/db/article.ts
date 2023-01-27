import {GridFSBucket, ObjectId} from "mongodb";
import {requireDatabase} from "./database";
import {nanoid} from "nanoid";
import {Readable} from "stream";

export interface ArticleMeta {
    _id: ArticleID;
    author: UserID;
    title: string;
    forward: string;
    cover: ImageID;
    postTime: Date;
}

interface ArticleStore extends ArticleMeta {
    file: ObjectId
}

export interface Article extends ArticleMeta {
    read(): Readable
}

const collectionId = "article";

export async function addArticle(author: UserID, title: string, cover: ImageID, forward: string, body: string): Promise<ArticleMeta | undefined> {
    requireBucket();

    const fileId = await (new Promise<ObjectId>((resolve, reject) => {
        const stream = renderBucket.openUploadStream(title + ".md");
        stream.write(body);
        stream.once('error', (err) => {
            reject(err)
        })
        stream.once('finish', () => {
            resolve(stream.id)
        })
        stream.end();
    }));
    if (!fileId) return undefined;

    const store: ArticleStore = {
        author, title, cover, forward,
        _id: nanoid(),
        file: fileId,
        postTime: new Date()
    }
    await db.collection<ArticleStore>(collectionId).insertOne(store);
}

const transformer = (v: ArticleStore) => ({
    _id: v._id,
    author: v.author,
    title: v.title,
    cover: v.cover,
    forward: v.forward,
    postTime: v.postTime,
    read: () => requireBucket().openDownloadStream(v.file)
});

export async function listArticles(): Promise<Article[]> {
    requireDatabase();
    return db.collection<ArticleStore>(collectionId)
        .find()
        .map(transformer)
        .toArray()
}

export async function getArticle(id: ArticleID): Promise<Article | undefined> {
    const meta = await requireDatabase().collection<ArticleStore>(collectionId).findOne({_id: id});
    if (!meta) return undefined;
    return transformer(meta);
}

function requireBucket(): GridFSBucket {
    requireDatabase();
    if (!globalThis.renderBucket) {
        globalThis.renderBucket = new GridFSBucket(db, {bucketName: "renders"});
    }
    return globalThis.renderBucket
}

declare global {
    var renderBucket: GridFSBucket
}