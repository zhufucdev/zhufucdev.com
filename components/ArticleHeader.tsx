import React, { RefObject, useCallback, useEffect, useState } from 'react'
import { useMediaQuery, useScrollTrigger, useTheme } from '@mui/material'
import Typography from '@mui/material/Typography'
import Box from '@mui/material/Box'
import { LazyImage } from './LazyImage'
import { getImageUri } from '../lib/utility'
import { useTitle } from '../lib/useTitle'
import { RenderingArticle } from './ArticleCard'
import { drawerWidth } from './AppFrame'

export function ArticleHeader(props: {
    meta: RenderingArticle
}): JSX.Element {
    const theme = useTheme()
    const onLargeScreen = useMediaQuery(theme.breakpoints.up('sm'))

    const titleRef = useCallback((node: HTMLTitleElement) => {
        if (node) {
            setTitleHeight(node.getBoundingClientRect().height)
        }
    }, [])
    const [titleHeight, setTitleHeight] = useState(0)
    const scrolled = useScrollTrigger({
        threshold: titleHeight,
        disableHysteresis: true,
    })
    const [, setTitle] = useTitle({ appbar: '文章', head: props.meta.title })
    useEffect(() => {
        if (scrolled) setTitle(props.meta.title)
        else setTitle({ appbar: '文章', head: props.meta.title })
    }, [scrolled, props.meta.title])

    return (
        <>
            {props.meta.cover && (
                <Box
                    sx={{
                        position: 'absolute',
                        height: 250,
                        top: 0,
                        left: onLargeScreen ? drawerWidth : 0,
                        right: 0,
                        zIndex: -1,
                    }}
                >
                    <Box
                        sx={{
                            width: '100%',
                            height: '100%',
                            position: 'absolute',
                            background: `linear-gradient(180deg, transparent 70%, ${theme.palette.background.default} 100%)`,
                        }}
                    />
                    <LazyImage
                        src={getImageUri(props.meta.cover)}
                        alt="文章封面"
                        style={{
                            width: '100%',
                            height: 250,
                            objectFit: 'cover',
                        }}
                    />
                </Box>
            )}
            <Typography
                variant="h3"
                ref={titleRef}
                mt={props.meta.cover ? 10 : 0}
            >
                {props.meta.title}
            </Typography>

        </>
    )
}

