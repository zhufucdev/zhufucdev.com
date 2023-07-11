import React, {useCallback, useEffect, useState} from "react";
import {useMediaQuery, useScrollTrigger, useTheme} from "@mui/material";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import {drawerWidth} from "../pages/_app";
import {LazyImage} from "./LazyImage";
import {getImageUri} from "../lib/utility";
import {motion} from "framer-motion";
import List from "@mui/material/List";
import {ContentsNodeComponent} from "./ContentsNodeComponent";
import {Contents, ContentsNode, useContents} from "../lib/useContents";
import {useTitle} from "../lib/useTitle";
import {RenderingArticle} from "./ArticleCard";

export function ArticleHeader(props: { meta: RenderingArticle, article: React.RefObject<HTMLDivElement> }): JSX.Element {
    const theme = useTheme();
    const onLargeScreen = useMediaQuery(theme.breakpoints.up('sm'));
    const onWideScreen = useMediaQuery(theme.breakpoints.up('md'));

    const titleRef = useCallback((node: HTMLTitleElement) => {
        if (node) {
            setTitleHeight(node.getBoundingClientRect().height);
        }
    }, []);
    const [titleHeight, setTitleHeight] = useState(0);
    const scrolled = useScrollTrigger({threshold: titleHeight, disableHysteresis: true});
    const [, setTitle] = useTitle({appbar: '文章', head: props.meta.title});
    useEffect(() => {
        if (scrolled)
            setTitle(props.meta.title);
        else
            setTitle({appbar: '文章', head: props.meta.title});
    }, [scrolled, props.meta.title]);

    const [contents, setContents] = useContents();

    useEffect(() => {
        if (!props.article.current) {
            setContents(undefined);
            return
        }

        setContents(generateNodeTree(props.article.current));
    }, [props.article, props.meta]);

    return <>
        {
            props.meta.cover
            && <Box
                sx={{
                    position: 'absolute',
                    height: 250,
                    top: 0,
                    left: onLargeScreen ? drawerWidth : 0,
                    right: 0,
                    zIndex: -1,
                }}
            >
                <Box sx={{
                    width: '100%',
                    height: '100%',
                    position: 'absolute',
                    background: `linear-gradient(180deg, transparent 70%, ${theme.palette.background.default} 100%)`
                }}/>
                <LazyImage
                    src={getImageUri(props.meta.cover)}
                    alt="文章封面"
                    style={{
                        width: '100%',
                        height: 250,
                        objectFit: 'cover'
                    }}
                />
            </Box>
        }
        <Typography variant="h3" ref={titleRef} mt={props.meta.cover ? 10 : 0}>{props.meta.title}</Typography>

        {onWideScreen && contents &&
            <motion.div
                animate={{y: scrolled || !Boolean(props.meta.cover) ? 0 : 180}}
                style={{
                    width: 240,
                    position: 'fixed',
                    top: '70px',
                    bottom: 100,
                    right: 10,
                    overflowY: 'auto'
                }}
            >
                <List sx={{'.MuiListItemButton-root': {borderRadius: 4}}}
                      dense>
                    <ContentsNodeComponent node={contents}/>
                </List>
            </motion.div>
        }
    </>;
}

function generateNodeTree(root: HTMLDivElement): Contents {
    function generateNode(coll: HTMLCollection, from: number): [ContentsNode | undefined, number] {
        function getLevel(ele?: Element): number {
            if (!ele || ele.tagName.length !== 2 || ele.tagName.charAt(0).toLowerCase() !== 'h') return 0;
            return parseInt(ele.tagName.charAt(1));
        }

        let children: ContentsNode[] = [], parent: Element | undefined, baseline: number | undefined;
        for (let i = from; i < coll.length; i++) {
            const curr = coll[i];
            const lv = getLevel(curr);
            if (lv > 0) {
                parent = curr;
                from = i;
                baseline = lv;
                break
            }
        }

        if (!parent || !baseline) return [undefined, coll.length];

        for (let i = from + 1; i < coll.length; i++) {
            const curr = coll[i];
            const lv = getLevel(curr);
            if (lv > 0) {
                if (lv <= baseline) {
                    return [pack(parent), i];
                } else {
                    const [node, end] = generateNode(coll, i);
                    i = end - 1;
                    if (node) children.push(node);
                }
            }
        }

        function pack(parent: Element) {
            parent.textContent && parent.setAttribute('id', parent.textContent);
            return {
                title: parent.textContent ?? '',
                element: parent,
                href: `#${parent.textContent}`,
                children
            }
        }

        return [pack(parent), coll.length];
    }

    const elements = root.children;
    const tree: ContentsNode[] = [];

    let lastEnd = 0;
    while (true) {
        const [node, lastIndex] = generateNode(elements, lastEnd);
        lastEnd = lastIndex;
        if (node) tree.push(node);
        if (lastIndex >= elements.length) break;
    }

    return {
        target: 'articles',
        nodes: tree
    }
}
