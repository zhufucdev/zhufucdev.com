import {Backdrop} from "@mui/material";
import {LazyImage} from "./LazyImage";
import {getHumanReadableTime, getImageUri, lookupImage} from "../lib/utility";
import {useEffect, useState} from "react";
import {lookupUser} from "../lib/useUser";
import Typography from "@mui/material/Typography";

interface ImageViewerProps {
    src?: string;
    image?: ImageID;
    open: boolean;
    onClose: () => void;
}

export function ImageViewer(props: ImageViewerProps) {
    const src = props.src ?? getImageUri(props.image!);
    const [imageDes, setImageDes] = useState('');
    const [imageExtra, setExtra] = useState('');
    useEffect(() => {
        if (props.image) {
            lookupImage(props.image).then(meta => {
                if (meta) {
                    lookupUser(meta.uploader).then(user => {
                        setImageDes(`图片${meta.name}`);
                        setExtra(`由${user?.nick ?? meta.uploader}上传于${getHumanReadableTime(new Date(meta.uploadTime))}`)
                    })
                } else {
                   setImageDes(`图片${props.image} 无追加信息`)
                }
            })
        } else {
            setImageDes(`外部图片`)
        }
    }, [props.image, props.src])
    return <Backdrop open={props.open} onClick={props.onClose} unmountOnExit
                     sx={{zIndex: 10000, display: 'flex', flexDirection: 'column'}}>
        <LazyImage
            src={src}
            alt={imageDes}
            style={{
                width: '80%',
                maxHeight: '80%',
                objectFit: 'contain'
            }}
        />
        <Typography variant="body1" mt={1} color="whitesmoke">
            {imageDes}
        </Typography>
        {
            imageExtra && <Typography variant="caption" color="whitesmoke">{imageExtra}</Typography>
        }
    </Backdrop>
}