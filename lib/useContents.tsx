import React, { useContext, useEffect, useMemo, useState } from 'react'
import { nanoid } from 'nanoid'

const ContentsInstance = React.createContext<ContentsContext>([
    undefined,
    () => {},
])

/**
 * Represents a contents item
 */
export interface ContentsNode {
    title: string
    element: Element
    children: ContentsNode[]
    href: string
}

/**
 * Represents a contents item,
 * but iterable both forwards and backwards
 */
export interface ContentsNodeState extends ContentsNode {
    /**
     * undefined only if this node is the root one
     */
    children: ContentsNodeState[]
    parent: ContentsNodeState
    id: string
}

export interface Contents {
    target: string
    nodes: ContentsNode[]
}

export class ContentsRootNode implements ContentsNodeState {
    children: ContentsNodeState[]
    element: Element
    href: string = '#'
    id: string = 'root'
    parent: ContentsNodeState = this
    title: string = 'root'
    target: string

    constructor(contents: Contents) {
        this.element = contents.nodes[0]?.element
        this.children = generateStateFor(contents.nodes, this)
        this.target = contents.target
    }

    static isNodeRoot(node: ContentsNode): boolean {
        const id = (node as ContentsNodeState).id
        return id === 'root'
    }
}

export type ContentsContext = [
    ContentsRootNode | undefined,
    (contents?: Contents) => void,
]

export function ContentsProvider(props: { children: React.ReactNode }) {
    const [root, setRoot] = useState<ContentsRootNode>()
    const contents = useMemo<ContentsContext>(
        () => [
            root,
            (contents) => {
                if (contents && contents.nodes.length > 0)
                    setRoot(new ContentsRootNode(contents))
                else setRoot(undefined)
            },
        ],
        [root]
    )
    return <ContentsInstance.Provider {...props} value={contents} />
}

export function useContents(): ContentsContext {
    return useContext(ContentsInstance)
}

function generateStateFor(
    contents: ContentsNode[],
    root: ContentsRootNode,
    parent?: ContentsNodeState
): ContentsNodeState[] {
    return contents.map((v) => {
        const state: ContentsNodeState = {
            title: v.title,
            element: v.element,
            href: v.href,
            children: [],
            parent: parent ?? root,
            id: nanoid(),
        }
        state.children = generateStateFor(v.children, root, state)
        return state
    })
}
