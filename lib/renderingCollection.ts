import { ArticleCollection, ArticleMeta } from '../lib/db/article'
import { getSafeArticle, SafeArticle } from '../lib/safeArticle'

export type RenderingCollection = Omit<
    ArticleCollection,
    keyof AsyncIterable<ArticleMeta> | 'articles' | 'postTime' | 'stream'
> & { articles: SafeArticle[]; postTime: string }

export async function getRenderingCollection(
    source: ArticleCollection
): Promise<RenderingCollection> {
    const copy: Pick<
        Partial<ArticleCollection>,
        keyof AsyncIterable<ArticleMeta>
    > &
        Omit<ArticleCollection, keyof AsyncIterable<ArticleMeta>> = {
        ...source,
    }
    delete copy[Symbol.asyncIterator]

    const articles: SafeArticle[] = []
    for await (const meta of source) {
        articles.push(getSafeArticle(meta))
    }
    return {
        ...copy,
        articles,
        postTime: source.postTime.toISOString(),
    }
}
