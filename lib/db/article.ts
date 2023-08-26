/**
 * Server-side database adapter
 */

import { Filter, GridFSBucket, ObjectId } from 'mongodb'
import { requireDatabase } from './database'
import { Readable } from 'stream'
import { WithDislikes, WithLikes } from './remark'
import { attachImage, detachImage, notifyTargetRenamed } from './image'
import { readTags, TagKey, Tags, WithTags } from '../tagging'
import { User } from './user'
import { hasPermission } from '../contract'
import { nanoid } from 'nanoid'
import { WithComments } from './comment'
import { getDoc } from './get'
import * as Diff from 'diff'

export interface ArticleMeta
    extends WithLikes,
        WithDislikes,
        WithTags,
        WithComments {
    _id: ArticleID
    author: UserID
    title: string
    forward: string
    cover?: ImageID
    postTime: Date
}

interface ArticleStore extends Omit<ArticleMeta, 'tags'> {
    file: ObjectId
    tags: string[]
}

export interface Article extends ArticleMeta {
    stream(): Readable
}

const articleCollId = 'articles'
const collectionCollId = 'collections'

export async function addArticle(
    id: ArticleID,
    author: UserID,
    title: string,
    cover: ImageID | undefined,
    forward: string,
    body: string,
    tags: string[] = []
): Promise<ArticleStore | undefined> {
    requireBucket()
    const stream = renderBucket.openUploadStream(title + '.mdx')
    try {
        await writeBody(stream, body)
    } catch (e) {
        return undefined
    }
    const fileId = stream.id
    if (!fileId) return undefined

    const store: ArticleStore = {
        author,
        title,
        forward,
        _id: id,
        file: fileId,
        postTime: new Date(),
        likes: [],
        dislikes: [],
        comments: [],
        tags,
    }
    if (cover) {
        store.cover = cover
        attachImage(cover, id)
    }
    const acknowledged = (
        await db.collection<ArticleStore>(articleCollId).insertOne(store)
    ).acknowledged
    if (acknowledged) {
        return store
    } else {
        return undefined
    }
}

export async function duplicateArticle(
    origin: ArticleID
): Promise<ArticleStore | undefined> {
    const db = requireDatabase().collection<ArticleStore>(articleCollId)
    const doc = await db.findOne({ _id: origin })
    if (!doc) return undefined

    requireBucket()
    const ds = renderBucket.openDownloadStream(doc.file)
    const us = renderBucket.openUploadStream(doc.title + '.md')
    doc.file = us.id
    ds.pipe(us, { end: true })

    await new Promise<void>((accept) => {
        ds.once('end', () => {
            accept()
        })
    })

    doc._id = nanoid()
    const res = await db.insertOne(doc)
    if (!res.acknowledged) return undefined
    return doc
}

const transformer = (v: ArticleStore) => {
    const data = {
        _id: v._id,
        author: v.author,
        title: v.title,
        forward: v.forward,
        postTime: v.postTime,
        likes: v.likes ?? [],
        dislikes: v.dislikes ?? [],
        tags: readTags(v.tags) ?? [],
        comments: v.comments ?? [],
        stream: () => requireBucket().openDownloadStream(v.file),
    } as Article
    if (v.cover) {
        data.cover = v.cover
    }
    return data
}

export async function listArticles(
    criteria?: Partial<ArticleMeta>
): Promise<Article[]> {
    requireDatabase()

    let filter: Filter<ArticleStore>
    let tagsCriteria: Tags = {}
    if (criteria) {
        filter = criteria
        if (criteria.tags) {
            tagsCriteria = criteria.tags
            delete filter.tags
        }
    } else {
        filter = {}
    }

    return (
        await db
            .collection<ArticleStore>(articleCollId)
            .find(filter)
            .map(transformer)
            .toArray()
    )
        .filter((meta: Article) => {
            for (const key in tagsCriteria) {
                if (meta.tags[key as TagKey] !== tagsCriteria[key as TagKey]) {
                    return false
                }
            }
            return true
        })
        .reverse()
}

export async function getArticle(id: ArticleID): Promise<Article | undefined> {
    const meta = await requireDatabase()
        .collection<ArticleStore>(articleCollId)
        .findOne({ _id: id })
    if (!meta) return undefined
    return transformer(meta)
}

export type ArticleUpdate = Partial<
    ArticleMeta & { body: string; tags: string[] }
>

export async function updateArticle(
    id: ArticleID,
    update: ArticleUpdate
): Promise<boolean> {
    const original = await requireDatabase()
        .collection<ArticleStore>(articleCollId)
        .findOne({ _id: id })
    if (!original) return false
    if (update.body) {
        requireBucket()
        await renderBucket.delete(original.file)
        const stream = renderBucket.openUploadStreamWithId(
            original.file,
            update.title ?? original.title + '.md'
        )
        try {
            await writeBody(stream, update.body)
        } catch (e) {
            return false
        }
        delete update.body
    }
    if (update.cover) {
        original.cover && detachImage(original.cover, original._id)
        attachImage(update.cover, original._id)
    }
    if (update._id && update._id !== id) {
        if (!(await changeId(original, update._id))) {
            return false
        }
        id = update._id
    }
    const res = await db
        .collection<ArticleStore>(articleCollId)
        .findOneAndUpdate({ _id: id }, { $set: update })
    return res.ok === 1
}

async function changeId(
    original: ArticleStore,
    target: ArticleID
): Promise<boolean> {
    notifyTargetRenamed(original._id, target)
    const db = requireDatabase().collection<ArticleStore>(articleCollId)
    db.findOneAndDelete({ _id: original._id })
    await db.findOneAndDelete({ _id: target }) // avoid id duplication
    const res = await db.insertOne({ ...original, _id: target })
    return res.acknowledged
}

function requireBucket(): GridFSBucket {
    requireDatabase()
    if (!globalThis.renderBucket) {
        globalThis.renderBucket = new GridFSBucket(db, {
            bucketName: 'articles',
        })
    }
    return globalThis.renderBucket
}

function writeBody(stream: NodeJS.WritableStream, body: string) {
    return new Promise<void>((resolve, reject) => {
        stream.write(body)
        stream.once('error', (err) => {
            reject(err)
        })
        stream.once('finish', () => {
            resolve()
        })
        stream.end()
    })
}

declare global {
    var renderBucket: GridFSBucket
}

export class ArticleUtil {
    public static proceedingFor(user: User): (meta: ArticleMeta) => boolean {
        return (meta) =>
            (meta.tags.hidden === true || meta.tags.private === true) &&
            (hasPermission(user, 'modify') || meta.author == user._id)
    }

    public static publicList(): (meta: ArticleMeta) => boolean {
        return (meta) => !meta.tags.hidden && !meta.tags.private
    }

    public static async languageVariants(
        meta: ArticleMeta
    ): Promise<ArticleMeta[]> {
        let origin: ArticleMeta | undefined
        if (meta.tags['t-from']) {
            origin = await getArticle(meta.tags['t-from'] as string)
        } else {
            origin = meta
        }
        if (origin) {
            return (
                (await listArticles({
                    tags: { 't-from': origin._id },
                })) as ArticleMeta[]
            )
                .filter((meta) => !meta.tags.private)
                .concat(origin)
        } else {
            return []
        }
    }
}

export type ArticleCollection = ArticleMeta &
    AsyncIterable<ArticleMeta> & { articles: Array<ArticleID> }
interface CollectionStore {
    _id: ArticleID
    articles: Array<ArticleID>
}

function collectionTransformer(base: Article, doc?: CollectionStore) {
    const coll: any = {
        ...base,
        articles: doc?.articles ?? [],
        [Symbol.asyncIterator]: async function* () {
            if (!doc) return
            let updateRequired = false
            for (const article of doc.articles) {
                const meta = await getArticle(article)
                if (meta) {
                    yield meta
                } else {
                    const index = doc.articles.indexOf(article)
                    doc.articles = doc.articles
                        .slice(0, index)
                        .concat(doc.articles.slice(index + 1))
                    updateRequired = true
                }
            }
            if (updateRequired) {
                db.collection(collectionCollId).findOneAndReplace(
                    { _id: base._id },
                    doc
                )
            }
        },
    }
    delete coll.stream
    return coll
}

export async function getCollection(
    id: ArticleID
): Promise<ArticleCollection | undefined> {
    const base = await getArticle(id)
    if (!base) {
        return undefined
    }
    const doc = await getDoc<CollectionStore>(collectionCollId, id)
    if (!doc) {
        return
    }
    return collectionTransformer(base, doc)
}

export async function listCollections(): Promise<
    ArticleCollection[] | undefined
> {
    const base = await listArticles({ tags: { collection: true } })
    const result: Array<ArticleCollection> = []
    for (const b of base) {
        const doc = await getDoc<CollectionStore>(collectionCollId, b._id)
        result.push(collectionTransformer(b, doc))
    }
    return result
}

export async function modifyCollection(
    id: ArticleID,
    article: ArticleID,
    remove?: boolean
) {
    requireDatabase()
    const dbColl = db.collection<CollectionStore>(collectionCollId)
    const update = await dbColl.findOneAndUpdate(
        { _id: id },
        remove
            ? { $pull: { articles: article } }
            : { $push: { articles: article } }
    )
    if (!update.value) {
        const res = await dbColl.insertOne({
            _id: id,
            articles: remove ? [] : [article],
        })
        return res.acknowledged
    }
    return true
}

export async function updateCollection(id: ArticleID, articles: ArticleID[]) {
    requireDatabase()
    const res = await db
        .collection<CollectionStore>(collectionCollId)
        .findOneAndUpdate({ _id: id }, { $set: { articles } })
    return res.ok === 1
}

/**
 * Update the containers (articles which happen to be collections)
 * of a contained article
 * @returns id of containers involved
 */
export async function updateArticleInCollection(
    id: ArticleID,
    collections: ArticleID[]
): Promise<ArticleID[]> {
    requireDatabase()
    const original =
        (await listCollections())
            ?.filter((col) => col.articles.includes(id))
            ?.map((col) => col._id) ?? []

    const involved: ArticleID[] = []
    const diff = Diff.diffArrays(original, collections)
    for (const entry of diff) {
        if (entry.added) {
            for (const entryId of entry.value) {
                modifyCollection(entryId, id)
                involved.push(entryId)
            }
        } else if (entry.removed) {
            for (const entryId of entry.value) {
                modifyCollection(entryId, id, true)
                involved.push(entryId)
            }
        }
    }

    return involved
}
