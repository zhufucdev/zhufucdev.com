import {GridFSBucket, ObjectId} from "mongodb";
import {requireDatabase} from "./database";
import {nanoid} from "nanoid";
import {Readable} from "stream";
import {WithDislikes, WithLikes} from "./remark";
import {attachImage} from "./image";

export interface ArticleMeta extends WithLikes, WithDislikes {
    _id: ArticleID;
    author: UserID;
    title: string;
    forward: string;
    cover?: ImageID;
    postTime: Date;
}

interface ArticleStore extends ArticleMeta {
    file: ObjectId
}

export interface Article extends ArticleMeta {
    stream(): Readable
}

const collectionId = "articles";

export async function addArticle(
    id: ArticleID,
    author: UserID,
    title: string,
    cover: ImageID | undefined,
    forward: string,
    body: string
): Promise<ArticleMeta | undefined> {
    requireBucket();
    const stream = renderBucket.openUploadStream(title + ".md");
    try {
        await writeBody(stream, body);
    } catch (e) {
        return undefined;
    }
    const fileId = stream.id;
    if (!fileId) return undefined;

    const store: ArticleStore = {
        author, title, forward,
        _id: id,
        file: fileId,
        postTime: new Date(),
        likes: [], dislikes: []
    }
    if (cover) {
        store.cover = cover;
        attachImage(cover, id);
    }
    const acknowledged = (await db.collection<ArticleStore>(collectionId).insertOne(store)).acknowledged;
    if (acknowledged) {
        return store;
    } else {
        return undefined;
    }
}

const transformer = (v: ArticleStore) => {
    const data = {
        _id: v._id,
        author: v.author,
        title: v.title,
        forward: v.forward,
        postTime: v.postTime,
        likes: v.likes,
        dislikes: v.dislikes,
        stream: () => requireBucket().openDownloadStream(v.file)
    } as Article;
    if (v.cover) {
        data.cover = v.cover;
    }
    return data;
};

export async function listArticles(): Promise<Article[]> {
    requireDatabase();
    return (await db.collection<ArticleStore>(collectionId)
        .find()
        .map(transformer)
        .toArray())
        .reverse()
}

export async function getArticle(id: ArticleID): Promise<Article | undefined> {
    const meta = await requireDatabase().collection<ArticleStore>(collectionId).findOne({_id: id});
    if (!meta) return undefined;
    return transformer(meta);
}

export type ArticleUpdate = Partial<ArticleMeta & { body: string }>;
export async function updateArticle(id: ArticleID, update: ArticleUpdate): Promise<boolean> {
    const original = await requireDatabase().collection<ArticleStore>(collectionId).findOne({_id: id});
    if (!original) return false;
    if (update.body) {
        requireBucket();
        await renderBucket.delete(original.file);
        const stream = renderBucket.openUploadStreamWithId(original.file, update.title ?? original.title + ".md");
        try {
            await writeBody(stream, update.body);
        } catch (e) {
            return false;
        }
        delete update.body;
    }
    if (update.cover) {

    }
    const res = await db.collection<ArticleStore>(collectionId).findOneAndUpdate({_id: id}, {$set: update});
    return res.ok === 1
}

function requireBucket(): GridFSBucket {
    requireDatabase();
    if (!globalThis.renderBucket) {
        globalThis.renderBucket = new GridFSBucket(db, {bucketName: "articles"});
    }
    return globalThis.renderBucket
}

function writeBody(stream: NodeJS.WritableStream, body: string) {
    return new Promise<void>((resolve, reject) => {
        stream.write(body);
        stream.once('error', (err) => {
            reject(err)
        })
        stream.once('finish', () => {
            resolve();
        })
        stream.end();
    })
}

declare global {
    var renderBucket: GridFSBucket
}