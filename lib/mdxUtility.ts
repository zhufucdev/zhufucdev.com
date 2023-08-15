import remarkGfm from 'remark-gfm'
import rehypeRaw from 'rehype-raw'
import { MDXRemoteSerializeResult } from 'next-mdx-remote'
import { serialize } from 'next-mdx-remote/serialize'

export async function serializedMdx(
    content: string
): Promise<MDXRemoteSerializeResult> {
    return serialize(content, {
        mdxOptions: {
            remarkPlugins: [remarkGfm],
            format: 'mdx'
        },
    })
}
