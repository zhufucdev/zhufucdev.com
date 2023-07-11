import {GridFSBucket, ObjectId} from "mongodb";
import {requireDatabase} from "./database";
import {Readable} from "stream";
import {WithDislikes, WithLikes} from "./remark";
import {attachImage, detachImage, notifyTargetRenamed} from "./image";
import {readTags, WithTags} from "../tagging";
import {User} from "./user";
import {hasPermission} from "../contract";

export interface ArticleMeta extends WithLikes, WithDislikes, WithTags {
    _id: ArticleID;
    author: UserID;
    title: string;
    forward: string;
    cover?: ImageID;
    postTime: Date;
}

interface ArticleStore extends Omit<ArticleMeta, "tags"> {
    file: ObjectId;
    tags: string[]
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
    body: string,
    tags: string[] = []
): Promise<ArticleStore | undefined> {
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
        likes: [], dislikes: [], tags
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
        tags: readTags(v.tags) ?? [],
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

export type ArticleUpdate = Partial<ArticleMeta & { body: string, tags: string[] }>;

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
        original.cover && detachImage(original.cover, original._id);
        attachImage(update.cover, original._id);
    }
    if (update._id && update._id !== id) {
        if (!await changeId(original, update._id)) {
            return false;
        }
        id = update._id;
    }
    const res = await db.collection<ArticleStore>(collectionId).findOneAndUpdate({_id: id}, {$set: update});
    return res.ok === 1
}

async function changeId(original: ArticleStore, target: ArticleID): Promise<boolean> {
    notifyTargetRenamed(original._id, target);
    const db = requireDatabase().collection<ArticleStore>(collectionId);
    db.findOneAndDelete({_id: original._id});
    await db.findOneAndDelete({_id: target}); // avoid id duplication
    const res = await db.insertOne({...original, _id: target});
    return res.acknowledged;
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

export class ArticleUtil {
    public static proceedingFor(user: User): (meta: ArticleMeta) => boolean {
        return meta => meta.tags.hidden === true
            && (hasPermission(user, 'modify') || meta.author == user._id)
    }

    public static public(): (meta: ArticleMeta) => boolean {
        return meta => !meta.tags.hidden
    }
}