import { Box, useMediaQuery, useTheme } from '@mui/material'
import { MDXRemoteSerializeResult } from 'next-mdx-remote'
import { useEffect, useRef } from 'react'
import { RenderingCollection } from '../lib/renderingCollection'
import { MarkdownScope } from './MarkdownScope'
import List from '@mui/material/List'
import { ContentsNodeComponent } from './ContentsNodeComponent'
import { Contents, ContentsNode, useContents } from '../lib/useContents'

interface Props {
    id: ArticleID
    body: MDXRemoteSerializeResult
    collection?: RenderingCollection
}

export default function ArticleBody({ id, body, collection }: Props) {
    const theme = useTheme()
    const container = useRef<HTMLDivElement>(null)
    const [contents, setContents] = useContents()
    const onWideScreen = useMediaQuery(theme.breakpoints.up('md'))

    useEffect(() => {
        if (!container.current || container.current.childElementCount <= 0) {
            setContents(undefined)
            return
        }

        const gen = generateNodeTree(container.current.children[0])
        setContents(gen)
        return () => setContents(undefined)
    }, [container, id])
    return (
        <>
            <Box
                width="100%"
                sx={{
                    [theme.breakpoints.up('md')]: {
                        width: 'calc(100% - 240px)',
                    },
                }}
                ref={container}
            >
                <MarkdownScope lazy collection={collection}>
                    {body}
                </MarkdownScope>
            </Box>
            {contents && onWideScreen && (
                <List
                    sx={{
                        '.MuiListItemButton-root': { borderRadius: 4 },
                        width: '240',
                    }}
                    dense
                >
                    <ContentsNodeComponent node={contents} />
                </List>
            )}
        </>
    )
}

function generateNodeTree(root: Element): Contents {
    function generateNode(
        coll: HTMLCollection,
        from: number
    ): [ContentsNode | undefined, number] {
        function getLevel(ele?: Element): number {
            if (
                !ele ||
                ele.tagName.length !== 2 ||
                ele.tagName.charAt(0).toLowerCase() !== 'h'
            )
                return 0
            return parseInt(ele.tagName.charAt(1))
        }

        let children: ContentsNode[] = [],
            parent: Element | undefined,
            baseline: number | undefined
        for (let i = from; i < coll.length; i++) {
            const curr = coll[i]
            const lv = getLevel(curr)
            if (lv > 0) {
                parent = curr
                from = i
                baseline = lv
                break
            }
        }

        if (!parent || !baseline) return [undefined, coll.length]

        for (let i = from + 1; i < coll.length; i++) {
            const curr = coll[i]
            const lv = getLevel(curr)
            if (lv > 0) {
                if (lv <= baseline) {
                    return [pack(parent), i]
                } else {
                    const [node, end] = generateNode(coll, i)
                    i = end - 1
                    if (node) children.push(node)
                }
            }
        }

        function pack(parent: Element) {
            parent.textContent && parent.setAttribute('id', parent.textContent)
            return {
                title: parent.textContent ?? '',
                element: parent,
                href: `#${parent.textContent}`,
                children,
            }
        }

        return [pack(parent), coll.length]
    }

    const elements = root.children
    const tree: ContentsNode[] = []

    let lastEnd = 0
    while (true) {
        const [node, lastIndex] = generateNode(elements, lastEnd)
        lastEnd = lastIndex
        if (node) tree.push(node)
        if (lastIndex >= elements.length) break
    }

    return {
        target: 'articles',
        nodes: tree,
    }
}
