import {ContentsNodeState, ContentsRootNode} from "../lib/useContents";
import ListItem from "@mui/material/ListItem";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemText from "@mui/material/ListItemText";
import * as React from "react";
import {useEffect, useMemo, useState} from "react";

export function ContentsNodeComponent(props: { node: ContentsNodeState, indent?: number, current?: string }) {
    const {node, indent} = props;

    function Item(props: { title: string, href: string, indent: number, selected: boolean }) {
        return <ListItem disablePadding>
            <ListItemButton
                component="a"
                href={props.href}
                selected={props.selected}
            >
                <ListItemText sx={{ml: props.indent}}>{props.title}</ListItemText>
            </ListItemButton>
        </ListItem>
    }

    const [currentTitle, setCurrentTitle] = useState(node.children[0]?.id ?? '');
    useEffect(() => {
        // an optimums algorithm to find the current header:
        // - single event handler
        // - cache
        if (!indent) {
            // this is a root node
            const nodesUnfolded: ContentsNodeState[] = [];

            function unfold(node: ContentsNodeState) {
                if (!ContentsRootNode.isNodeRoot(node))
                    nodesUnfolded.push(node)
                node.children.forEach(unfold);
            }

            unfold(node);

            let from = 0, lastScrolling = 0;

            function findAppropriateNode(from: number, reverse: boolean): number {
                function getDistance(index: number) {
                    return Math.abs(nodesUnfolded[index].element.getBoundingClientRect().y)
                }

                let min = getDistance(from);
                let i;
                if (reverse) {
                    for (i = from - 1; i >= 0; i--) {
                        const curr = getDistance(i);
                        if (curr > min) {
                            return i + 1;
                        }
                    }
                    return 0;
                } else {
                    for (i = from + 1; i < nodesUnfolded.length; i++) {
                        const curr = getDistance(i);
                        if (curr > min) {
                            return i - 1;
                        }
                    }
                    return nodesUnfolded.length - 1;
                }
            }

            function scrollHandler() {
                const curr = window.scrollY;
                from = findAppropriateNode(from, curr < lastScrolling);
                lastScrolling = curr;
                setCurrentTitle(nodesUnfolded[from].id);
            }

            window.removeEventListener('scroll', scrollHandler);
            window.addEventListener('scroll', scrollHandler);
        }
    }, [indent]);

    const selected = useMemo(() => props.node.id === props.current, [props.current]);

    return <>
        {indent && <Item key="master"
                         title={node.title}
                         href={node.href}
                         indent={indent}
                         selected={selected}/>}
        {
            node.children.map(n =>
                <ContentsNodeComponent
                    node={n}
                    indent={(indent ?? 0) + 2}
                    key={n.element.textContent}
                    current={indent ? props.current : currentTitle}
                />
            )
        }
    </>
}