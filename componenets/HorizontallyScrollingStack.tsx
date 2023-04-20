import {Fade, Stack, StackProps, useMediaQuery, useTheme} from "@mui/material";
import React, {useEffect, useRef, useState} from "react";
import {useWindowResize} from "../lib/useWindowResize";

export function HorizontallyScrollingStack(props: StackProps): JSX.Element {
    const theme = useTheme();
    const fixedDrawer = useMediaQuery(theme.breakpoints.up('sm'));
    const [fadeLeft, setFadeLeft] = useState(false);
    const [fadeRight, setFadeRight] = useState(true);
    const windowSize = useWindowResize();

    function scrollHandler(ev: React.UIEvent<HTMLDivElement>) {
        const left = ev.currentTarget.scrollLeft;
        const right = ev.currentTarget.scrollWidth - ev.currentTarget.clientWidth - ev.currentTarget.scrollLeft;
        if (left > 0 && !fadeLeft) {
            setFadeLeft(true)
        } else if (left <= 0 && fadeLeft) {
            setFadeLeft(false)
        }
        if (right > 0 && !fadeRight) {
            setFadeRight(true)
        } else if (right <= 0 && fadeRight) {
            setFadeRight(false)
        }
    }

    const scrollingRef = useRef<HTMLDivElement>();
    useEffect(() => {
        const ele = scrollingRef.current;
        if (!ele) return;
        setFadeRight(ele.scrollWidth > ele.clientWidth);
    }, [scrollingRef, windowSize])

    return <div style={{
        position: 'relative',
        width: fixedDrawer ? '100%' : 'calc(100vw - 24px)',
    }}>
        <Stack {...props}
               direction="row"
               sx={{overflowX: 'auto'}}
               onScroll={scrollHandler}
               ref={scrollingRef}/>
        <Fade in={fadeLeft}>
        <span style={{
            height: '100%',
            width: '60px',
            position: 'absolute',
            top: 0,
            left: 0,
            background: `linear-gradient(90deg, ${theme.palette.background.default} 0%, transparent 100%)`
        }}/>
        </Fade>
        <Fade in={fadeRight}>
        <span style={{
            height: '100%',
            width: '60px',
            position: 'absolute',
            top: 0,
            right: 0,
            background: `linear-gradient(-90deg, ${theme.palette.background.default} 0%, transparent 100%)`
        }}/>
        </Fade>
    </div>
}