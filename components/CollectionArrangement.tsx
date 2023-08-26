import { List, ListItem, ListItemIcon, ListItemText } from '@mui/material'
import { SafeArticle } from '../lib/safeArticle'

import React, {
    Dispatch,
    Ref,
    RefObject,
    useCallback,
    useEffect,
    useRef,
    useState,
} from 'react'
import MenuIcon from '@mui/icons-material/Menu'
import ArticleIcon from '@mui/icons-material/Article'

interface Props {
    articles: SafeArticle[]
    onArrange: (newValue: ArticleID[]) => void
}

export default function CollectionArragement({ articles, onArrange }: Props) {
    const [dragging, setDragging] = useState(false)
    const [dragDoc, setDragDoc] = useState<SafeArticle>()
    const [dragTarget, setDragTarget] = useState<DOMRect>()
    const [height, setHeight] = useState(-1)
    const [doms, setDoms] = useState<{[key: ArticleID]: HTMLDivElement}>({})

    useEffect(() => {
        if (height < 0 || !dragging) {
            return
        }
        const targetIndex = articles.findIndex((v) => v._id === dragDoc!._id)
        if (targetIndex < 0) {
            return
        }
        if (!doms || Object.entries(doms).length < articles.length) {
            return
        }

        const id = articles.map((meta) => meta._id)
        if (targetIndex > 0 && doms[id[0]].getBoundingClientRect().top > height) {
            onArrange(
                [id[targetIndex]]
                    .concat(id.slice(0, targetIndex))
                    .concat(id.slice(targetIndex + 1))
            )
            return
        }
        for (let index = 1; index < id.length; index++) {
            const current = doms[id[index]].getBoundingClientRect(),
                prev = doms[id[index - 1]].getBoundingClientRect()
            if (current.top + current.height / 2 > height && prev.top + prev.height / 2 < height) {
                if (index < targetIndex) {
                    onArrange(
                        id
                            .slice(0, index)
                            .concat(id[targetIndex])
                            .concat(id.slice(index + 1, targetIndex))
                            .concat(id[index])
                            .concat(id.slice(targetIndex + 1))
                    )
                    return
                } else if (index > targetIndex) {
                    onArrange(
                        id
                            .slice(0, targetIndex)
                            .concat(id[index])
                            .concat(id.slice(targetIndex + 1, index))
                            .concat(id[targetIndex])
                            .concat(id.slice(index + 1))
                    )
                }
            }
        }
    }, [height, doms, dragging, articles])

    return (
        <>
            <List>
                {articles.map((meta) => (
                    <ArticleView
                        meta={meta}
                        key={meta._id}
                        hidden={dragging && dragDoc?._id === meta._id}
                        onDraggingStarted={(bounds) => {
                            setDragging(true)
                            setDragDoc(meta)
                            setDragTarget(bounds)
                        }}
                        onDraggingEnded={() => setDragging(false)}
                        onHeightChanged={setHeight}
                        setDom={(ele) => setDoms((pre) => ({...pre, [meta._id]: ele}))}
                    />
                ))}
            </List>
            {dragging && (
                <ArticleView
                    floating
                    x={dragTarget!.x}
                    y={height}
                    width={dragTarget!.width}
                    meta={dragDoc!}
                    onHeightChanged={setHeight}
                    onDraggingEnded={() => setDragging(false)}
                />
            )}
        </>
    )
}

type ArticleViewProps = DndIndicatorProps & {
    meta: SafeArticle
    hidden?: boolean
    floating?: boolean
    x?: number
    y?: number
    width?: number
}

interface DndIndicatorProps {
    onHeightChanged?: (y: number) => void
    onDraggingStarted?: (bounds: DOMRect, element: Element) => void
    onDraggingEnded?: () => void
    setDom?: Dispatch<HTMLDivElement>
}

function ArticleView({
    meta,
    hidden,
    floating,
    x,
    y,
    width,
    ...dndProps
}: ArticleViewProps) {
    const dom = useRef<HTMLLIElement>(null)
    return (
        <ListItem
            disablePadding
            id={meta._id}
            ref={dom}
            secondaryAction={
                <DndIndicator
                    {...dndProps}
                    onDraggingStarted={() => {
                        if (dndProps.onDraggingStarted) {
                            dom.current &&
                                dndProps.onDraggingStarted.call(
                                    undefined,
                                    dom.current.getBoundingClientRect(),
                                    dom.current
                                )
                        }
                    }}
                />
            }
            sx={{
                m: 1,
                opacity: hidden ? 0 : 1,
                ...(floating && {
                    position: 'fixed',
                    top: y! - 20,
                    left: x! - 8,
                    width,
                }),
            }}
        >
            <ListItemIcon>
                <ArticleIcon />
            </ListItemIcon>
            <ListItemText>{meta.title}</ListItemText>
        </ListItem>
    )
}

function DndIndicator({
    onHeightChanged,
    onDraggingStarted,
    onDraggingEnded,
    setDom,
}: DndIndicatorProps) {
    const ref = useRef<HTMLDivElement>(null)
    useEffect(() => {
        if (!ref.current || !setDom) {
            return
        }
        setDom(ref.current)
    }, [ref])

    useEffect(() => {
        function handler(ev: MouseEvent) {
            if (ref.current) {
                const mouseX = ev.clientX
                const bounds = ref.current.getBoundingClientRect()
                if (mouseX <= bounds.left || mouseX >= bounds.right) {
                    onDraggingEnded?.call(undefined)
                }
            }
        }
        window.addEventListener('mousemove', handler)

        return () => window.removeEventListener('mousemove', handler)
    }, [])

    function handleMouseDown(ev: React.MouseEvent<HTMLDivElement>) {
        onDraggingStarted?.call(
            undefined,
            ev.currentTarget.getBoundingClientRect(),
            ev.currentTarget
        )
        onHeightChanged?.call(undefined, ev.clientY)
    }

    function handleMouseUp() {
        onDraggingEnded?.call(undefined)
    }

    function handleMouseMove(ev: React.MouseEvent<HTMLDivElement>) {
        onHeightChanged?.call(undefined, ev.clientY)
    }

    return (
        <div
            onMouseDown={handleMouseDown}
            onMouseUp={handleMouseUp}
            onMouseMove={handleMouseMove}
            style={{ cursor: 'move' }}
            ref={ref}
        >
            <MenuIcon />
        </div>
    )
}
