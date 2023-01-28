import {useUser} from "../lib/useUser";
import {
    Box,
    ButtonBase,
    Popover,
    PopoverProps,
    Skeleton,
    Stack,
    Typography,
    useMediaQuery,
    useTheme
} from "@mui/material";
import * as React from "react";
import {useCallback, useEffect, useState} from "react";
import {ImageMeta} from "../lib/db/image";
import CheckedIcon from "@mui/icons-material/CheckCircleOutline";
import {LazyImage} from "./LazyImage";
import {getImageUri} from "../lib/utility";
import UploadIcon from "@mui/icons-material/UploadFile";
import ErrorIcon from "@mui/icons-material/Error";

type ImagesPopoverProps = PopoverProps & {
    selected: ImageID | 'upload' | undefined,
    onSelectImage?: (image: ImageID) => void,
    onSelectUpload?: (file: File) => void
};

export function ImagesPopover(props: ImagesPopoverProps): JSX.Element {
    const {user} = useUser();
    const theme = useTheme();
    const smallScreen = useMediaQuery(theme.breakpoints.down('sm'));

    const [images, setImages] = useState<ImageMeta[]>([]);
    const [loaded, setLoaded] = useState(false);
    const [upload, setUpload] = useState('');
    const [failMsg, setFailMsg] = useState('');
    useEffect(() => {
        if (!user) return;
        (async () => {
            const res = await fetch('/api/images');
            if (res.ok) {
                setFailMsg('');
                const images = await res.json() as ImageMeta[];
                setImages(images);
            } else {
                setFailMsg(await res.text());
            }
            setLoaded(true);
        })();
    }, [user]);

    const generateGrid = useCallback(
        (length: number, producer: (i: number) => JSX.Element) => {
            const elements = new Array<JSX.Element>();
            const columns = smallScreen ? 2 : 3;
            for (let i = 0; i < Math.ceil(length / columns); i++) {
                const row = new Array<JSX.Element>();
                for (let j = 0; j < columns; j++) {
                    const index = i * columns + j;
                    if (index >= length) break;
                    row.push(producer(index));
                }
                elements.push(<Stack spacing={1} direction="row" key={`placeholder-${i}`}>{row}</Stack>)
            }
            return <Stack spacing={1} key={`placeholder`}>
                {elements}
            </Stack>;
        }, [smallScreen]);

    function CheckedBackdrop(props: { show: boolean }): JSX.Element {
        const {show} = props;
        return (
            <Box
                sx={{
                    background: theme.palette.primary.main,
                    display: show ? 'flex' : 'none',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: 1,
                    height: '100%',
                    width: '100%',
                    opacity: 0.4,
                    position: 'absolute',
                    top: 0
                }}>
                <CheckedIcon sx={{width: 48, height: 48}}/>
            </Box>
        )
    }

    function produceImage(i: number): JSX.Element {
        const meta = images[i];

        function handleClick() {
            if (props.onSelectImage) {
                props.onSelectImage(meta._id)
            }
        }

        return (
            <ButtonBase
                onClick={handleClick}
                sx={{borderRadius: 1}}
                TouchRippleProps={{
                    style: {
                        color: theme.palette.primary.main
                    }
                }}
                focusRipple>
                <LazyImage
                    src={getImageUri(meta._id)}
                    style={{
                        width: "100px",
                        height: "100px",
                        objectFit: "cover",
                        borderRadius: 4
                    }}
                    key={meta._id}
                    alt={`user image named ${meta.name}`}/>
                <CheckedBackdrop show={props.selected === meta._id}/>
            </ButtonBase>
        )
    }

    function produceUpload(): JSX.Element {
        function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
            const files = event.currentTarget.files
            if (files && files.length >= 1) {
                setUpload('');
                const reader = new FileReader();
                reader.addEventListener('load', () => {
                    setUpload(reader.result as string);
                });
                reader.readAsDataURL(files[0]);
                if (props.onSelectUpload) props.onSelectUpload(files[0])
            }
        }

        function handleClick(event: React.MouseEvent<HTMLInputElement>) {
            if (!upload || props.selected === "upload") {
                return
            }
            event.preventDefault();
            if (props.onSelectImage) props.onSelectImage("upload");
        }

        return (
            <ButtonBase
                component="label"
                TouchRippleProps={{
                    style: {color: theme.palette.primary.main}
                }}
                sx={{
                    width: 100,
                    height: 100,
                    borderRadius: 1
                }}>
                <input accept="image/*" type="file" hidden onChange={handleChange} onClick={handleClick}/>
                {!upload && <UploadIcon color="primary"/>}
                {upload
                    ? <>
                        <LazyImage
                            src={upload}
                            style={{
                                height: 100,
                                left: 0,
                                position: "absolute",
                                top: 0,
                                width: 100,
                                objectFit: "cover",
                                borderRadius: 4
                            }}
                            alt="upload preview"/>
                        <CheckedBackdrop show={props.selected === "upload"}/>
                    </>
                    : undefined
                }
            </ButtonBase>
        )
    }

    return (
        <Popover {...props}>
            {failMsg
                ? <Box width="30vw" height="30vw" sx={{display: 'flex'}}
                       justifyContent="center" alignItems="center"
                       flexDirection="column"
                       padding={2}
                >
                    <ErrorIcon color="error"/>
                    <Typography variant="body1">{failMsg}</Typography>
                </Box>
                : <Stack spacing={2} m={1}>
                    {loaded
                        ? generateGrid(
                            images.length + 1,
                            (i) =>
                                i < images.length ? produceImage(i) : produceUpload()
                        )
                        : generateGrid(
                            smallScreen ? 2 : 9,
                            () => <Skeleton width={100} height={100}/>
                        )}
                </Stack>}
        </Popover>
    )
}