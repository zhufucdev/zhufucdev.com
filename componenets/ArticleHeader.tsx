import React, {useEffect, useRef, useState} from "react";
import {useMediaQuery, useScrollTrigger, useTheme} from "@mui/material";
import {useTitle} from "../lib/useTitle";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import {drawerWidth} from "../pages/_app";
import {LazyImage} from "./LazyImage";
import {getImageUri} from "../lib/utility";

export function ArticleHeader(props: { cover: ImageID | undefined, title: string, onScroll?: (scrolled: boolean) => void }): JSX.Element {
    const theme = useTheme();
    const onLargeScreen = useMediaQuery(theme.breakpoints.up('sm'));

    const titleRef = useRef<HTMLTitleElement>(null);
    const [titleHeight, setTitleHeight] = useState(0);
    const scrolled = useScrollTrigger({threshold: titleHeight, disableHysteresis: true});
    const [, setTitle] = useTitle('文章')
    useEffect(() => {
        const title = titleRef.current;
        if (!title) return;
        setTitleHeight(title.getBoundingClientRect().top);
    }, [titleRef]);
    useEffect(() => {
        if (scrolled)
            setTitle(props.title);
        else
            setTitle('文章')
        props.onScroll?.call({}, scrolled);
    }, [scrolled, props.title, props.onScroll]);

    return <>
        {
            props.cover
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
                    src={getImageUri(props.cover)}
                    alt="文章封面"
                    style={{
                        width: '100%',
                        height: 250,
                        objectFit: 'cover'
                    }}
                />
            </Box>
        }
        <Typography variant="h3" ref={titleRef} mt={props.cover ? 10 : 0}>{props.title}</Typography>
    </>;
}