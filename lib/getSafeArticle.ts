import {Article, ArticleMeta} from "./db/article";

export type SafeArticle = Omit<ArticleMeta, "postTime"> & { postTime: string };

export function getSafeArticle(source: Article): SafeArticle {
    const data: SafeArticle = {
        _id: source._id,
        author: source.author,
        title: source.title,
        forward: source.forward,
        likes: source.likes,
        dislikes: source.dislikes,
        postTime: source.postTime.toISOString(),
        tags: source.tags,
        comments: source.comments
    }
    if (source.cover) {
        data.cover = source.cover;
    }
    return data
}

export function fromSaveArticle(source: SafeArticle): ArticleMeta {
    return {
        ...source,
        postTime: new Date(source.postTime)
    }
}