import remarkGfm from 'remark-gfm'
import { MDXRemoteSerializeResult } from 'next-mdx-remote'
import { serialize } from 'next-mdx-remote/serialize'
import fauxRemarkEmbedder from '@remark-embedder/core'
import fauxOembedTransformer from '@remark-embedder/transformer-oembed'

export async function serializedMdx(
    content: string
): Promise<MDXRemoteSerializeResult> {
    return serialize(content, {
        mdxOptions: {
            remarkPlugins: [
                remarkGfm,
                [fauxRemarkEmbedder, { transformers: [fauxOembedTransformer] }],
            ],
            format: 'mdx',
        },
    })
}
