import { Skeleton, SxProps } from '@mui/material'
import { CSSProperties, useEffect, useState } from 'react'
import { cacheImage } from '../lib/utility'

type LazyImageProps = {
    src: string | undefined
    alt: string
    style?: CSSProperties
    waveSx?: SxProps
    onClick?: () => void
}

export function LazyImage(props: LazyImageProps): JSX.Element {
    const [cached, setCached] = useState(false)
    useEffect(() => {
        if (props.src) cacheImage(props.src).then(() => setCached(true))
    }, [props.src])

    return cached ? (
        <img {...props} />
    ) : (
        <Skeleton
            variant="rectangular"
            animation="wave"
            style={props.style}
            sx={props.waveSx}
        />
    )
}
