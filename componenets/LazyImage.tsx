import {Skeleton} from "@mui/material";
import {CSSProperties, useEffect, useState} from "react";
import {cacheImage} from "../lib/utility";

type LazyImageProps = {
    src: string,
    alt: string,
    style?: CSSProperties,
}

export function LazyImage(props: LazyImageProps): JSX.Element {
    const [cached, setCached] = useState(false);
    useEffect(() => {
        cacheImage(props.src).then(() => setCached(true));
    }, [props.src])

    return (
        cached ? <img {...props}/> : <Skeleton variant="rectangular" animation="wave" style={props.style}/>
    )
}