import { Box, useMediaQuery, useTheme } from '@mui/material'
import { MDXRemoteSerializeResult } from 'next-mdx-remote'
import { RefObject, useEffect, useMemo, useRef, useState } from 'react'
import { RenderingCollection } from '../lib/renderingCollection'
import { MarkdownScope } from './MarkdownScope'
import List from '@mui/material/List'
import { ContentsNodeComponent } from './ContentsNodeComponent'
import {
    Contents,
    ContentsContext,
    ContentsNode,
    ContentsNodeState,
    useContents,
} from '../lib/useContents'
import useScroll from '../lib/useScroll'

interface Props {
    id: ArticleID
    body: MDXRemoteSerializeResult
    collection?: RenderingCollection
}

export default function ArticleBody({ id, body, collection }: Props) {
    const theme = useTheme()
    const container = useRef<HTMLDivElement>(null)
    const onWideScreen = useMediaQuery(theme.breakpoints.up('md'))

    const [contents, setContents] = useContents()
    const hasContents = useMemo(
        () => contents && contents.children.length > 0,
        [contents]
    )
    useEffect(() => {
        if (!container.current) {
            setContents(undefined)
            return
        }

        const gen = generateNodeTree(container.current)
        if (gen.nodes.length > 0) {
            setContents(gen)
        }
        return () => setContents(undefined)
    }, [container, id])

    return (
        <Box display="flex">
            <Box
                sx={{
                    width:
                        hasContents && onWideScreen
                            ? 'calc(100% - 240px)'
                            : '100%',
                }}
                ref={container}
            >
                <MarkdownScope collection={collection}>{body}</MarkdownScope>
            </Box>
            {onWideScreen && <ContentsView contents={contents} />}
        </Box>
    )
}

interface ContentProps {
    contents?: ContentsNodeState
}

function ContentsView({ contents }: ContentProps) {
    const [fixed, setFixed] = useState(false)
    const contentsRef = useRef<HTMLUListElement>(null)
    const scroll = useScroll(contentsRef.current ?? undefined)
    const windowScroll = useScroll()
    const [ultimateTop, setUltimateTop] = useState<number>(-1)

    useEffect(() => {
        let fixed = !Number.isNaN(scroll.top) && scroll.top <= 64
        if (fixed) {
            if (ultimateTop < 0) {
                setUltimateTop(windowScroll.top)
            } else {
                fixed = windowScroll.top > ultimateTop
            }
        }
        setFixed(fixed)
    }, [windowScroll, scroll])

    return (
        <>
            {contents && (
                <List
                    sx={{
                        '.MuiListItemButton-root': { borderRadius: 4 },
                        width: '220px',
                        ml: 2,
                        ...(fixed && {
                            position: 'fixed',
                            top: 64,
                            right: 28,
                        }),
                    }}
                    ref={contentsRef}
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
