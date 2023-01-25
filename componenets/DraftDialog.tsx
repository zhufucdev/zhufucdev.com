import {
    Box,
    Button, ButtonBase,
    Chip, Collapse,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle, IconButton, Popover, PopoverProps, Skeleton,
    Stack,
    SwipeableDrawer,
    TextField, Typography,
    useMediaQuery,
    useTheme
} from "@mui/material";
import {useRouter} from "next/router";
import {useProfile, useUser} from "../lib/useUser";
import {useRequestResult} from "../lib/useRequestResult";
import * as React from "react";
import {useCallback, useEffect, useMemo, useState} from "react";
import {getResponseRemark, hasPermission, maxUserMessageLength} from "../lib/contract";
import {getImageUri, postMessage, uploadImage} from "../lib/utility";
import {ProgressSlider} from "./PrograssSlider";
import {UserAvatar} from "./UserAvatar";
import {GoogleReCaptchaProvider, useGoogleReCaptcha} from "react-google-recaptcha-v3";
import {ReCaptchaPolicy} from "./ReCaptchaPolicy";

import BulbIcon from "@mui/icons-material/LightbulbOutlined";
import MessageIcon from "@mui/icons-material/MailOutline";
import IssueIcon from "@mui/icons-material/Report";
import RecentIcon from "@mui/icons-material/Podcasts";
import ImageIcon from "@mui/icons-material/ImageOutlined"
import UploadIcon from "@mui/icons-material/UploadFile";
import ErrorIcon from "@mui/icons-material/Error";
import CheckedIcon from "@mui/icons-material/CheckCircleOutline";
import {grey} from "@mui/material/colors";
import {LazyImage} from "./LazyImage";
import {ImageMeta} from "../lib/db/image";

type DraftDialogProps = {
    open: boolean,
    onClose: () => void,
    recaptchaKey: string,
    onPosted: (type: MessageType, id: any, raiser: UserID, content: MessageContent) => void
};

function RenderContent(props: DraftDialogProps): JSX.Element {
    const theme = useTheme();
    const router = useRouter();
    const {user} = useProfile();
    const {executeRecaptcha} = useGoogleReCaptcha();
    const handleResult = useRequestResult(
        () => setPosted(true),
        () => setFailed(true)
    )
    const fullscreen = useMediaQuery(theme.breakpoints.down('md'));
    const bodyStorageKey = "messageDraft";
    const titleStorageKey = "titleDraft";

    const [posting, setPosting] = useState(false);
    const [posted, setPosted] = useState(false);
    const [failed, setFailed] = useState(false);
    const [type, setType] = useState<MessageType>('inspiration');
    const [title, setTitle] = useState('');
    const [draft, setDraft] = useState('');
    const [wordCount, setWordCount] = useState(0);

    const [imageAnchor, setAnchor] = useState<HTMLElement>();
    const [titleImage, setTitleImage] = useState<ImageID>();
    const [titleUpload, setTitleUpload] = useState<File>();
    const canRaiseRecent = useMemo(() => user && hasPermission(user, 'raise_recent'), [user]);

    useEffect(() => {
        if (!user) return;
        const storedBody = localStorage.getItem(bodyStorageKey);
        if (storedBody) setDraft(storedBody);
        const storedTitle = localStorage.getItem(titleStorageKey);
        if (storedTitle) setTitle(storedTitle);
    }, [user]);

    useEffect(() => {
        setWordCount(draft.trim().length);
    }, [draft]);

    function handleDraftChange(event: React.ChangeEvent<HTMLInputElement>) {
        const value = event.currentTarget.value;
        let draft: string
        if (value.length > maxUserMessageLength) {
            draft = value.substring(0, maxUserMessageLength);
        } else {
            draft = value;
        }
        setDraft(draft);
        localStorage.setItem(bodyStorageKey, draft);
    }

    function handleTitleChange(event: React.ChangeEvent<HTMLInputElement>) {
        const value = event.currentTarget.value;
        setTitle(value);
        localStorage.setItem(titleStorageKey, value);
    }

    function reset(draftIncluded: boolean = true) {
        setPosting(false);
        setPosted(false);
        setFailed(false);
        if (draftIncluded) {
            setDraft('');
            localStorage.setItem(bodyStorageKey, '');
            setTitle('');
            localStorage.setItem(titleStorageKey, '');
        }
    }

    async function makePostRequest(token: string): Promise<{ response: Response, content?: MessageContent }> {
        if (type === 'recent') {
            let imageId: ImageID;
            if (titleImage === 'upload') {
                if (!titleUpload) throw new Error('no uploading candidate');
                const res = await uploadImage(titleUpload, token, 'save');
                if (!res.ok) {
                    return {response: res};
                }
                imageId = await res.text();
                if (executeRecaptcha) token = await executeRecaptcha(); // a new token is required
            } else {
                imageId = titleImage!;
            }
            const content = {body: draft, title: title, image: imageId};
            return {
                response: await postMessage(type, content, token),
                content
            }
        } else {
            const content = {body: draft};
            return {
                response: await postMessage(type, content, token),
                content
            }
        }
    }

    async function handlePost() {
        if (!executeRecaptcha) return;
        setPosting(true);
        const token = await executeRecaptcha();
        const {response: res, content} = await makePostRequest(token);
        let result: RequestResult;
        if (res.ok) {
            result = {success: true, respond: await res.text()}
        } else {
            result = await getResponseRemark(res);
        }
        handleResult(result);
        setTimeout(() => {
            props.onClose();
            if (result.success) {
                props.onPosted(type, result.respond, user!._id, content!);
            }
            setTimeout(() => reset(result.success), 1000);
        }, 2000);
    }

    function DraftChip(props: { label: string, type: MessageType, permit: PermissionID, icon: React.ReactElement, hide?: boolean }): JSX.Element {
        const permitted = user && hasPermission(user, props.permit);
        if (props.hide && !permitted) {
            return <></>;
        }
        return (
            <Chip
                label={props.label}
                variant={type === props.type ? 'filled' : 'outlined'}
                color={type === props.type ? 'primary' : 'default'}
                onClick={() => setType(props.type)}
                icon={props.icon}
                key={type}
                disabled={!permitted}
            />
        )
    }

    const chips =
        (<Stack direction="row" spacing={1} sx={{overflowX: 'auto'}}>
            <DraftChip label="近况"
                       type="recent"
                       permit="raise_recent"
                       icon={<RecentIcon fontSize="small"/>}
                       hide
            />
            <DraftChip label="灵感"
                       type="inspiration"
                       permit="raise_inspiration"
                       icon={<BulbIcon fontSize="small"/>}
            />
            <DraftChip label="私信"
                       type="pm"
                       permit="send_pm"
                       icon={<MessageIcon fontSize="small"/>}
            />
            <DraftChip label="提问"
                       type="issue"
                       permit="raise_issue"
                       icon={<IssueIcon fontSize="small"/>}
            />
        </Stack>);

    const inputs = (
        <Stack direction="row" spacing={2}>
            <UserAvatar user={user} size={48} sx={{mt: 0.2, ml: 0.2}}/>
            <Stack spacing={1} width="100%">
                <Collapse appear={false} in={type === 'recent'} mountOnEnter>
                    <TextField
                        variant="outlined"
                        label="标题"
                        type="text"
                        value={title}
                        fullWidth
                        onChange={handleTitleChange}
                        InputProps={{
                            endAdornment: (
                                <IconButton onClick={(ev) => setAnchor(ev.currentTarget)}>
                                    <ImageIcon/>
                                </IconButton>
                            )
                        }}
                    />
                </Collapse>
                <TextField
                    variant="outlined"
                    label={user ? "发言" : "得先登录才能发言"}
                    value={user ? draft : ''}
                    onChange={handleDraftChange}
                    fullWidth
                    multiline
                    disabled={!user}
                    helperText={`${wordCount} / ${maxUserMessageLength}`}
                    error={draft.length >= maxUserMessageLength}
                />
            </Stack>
        </Stack>
    );

    const canPost = wordCount > 0 && ((type === 'recent' && titleImage && title) || type !== 'recent');
    const content = <>
        <ProgressSlider loading={posting} done={posted} error={failed}>
            <DialogTitle>简单说些什么</DialogTitle>
            <DialogContent>
                <Stack spacing={2}>
                    {chips}
                    {inputs}
                </Stack>
                <ReCaptchaPolicy variant="body2"/>
            </DialogContent>
            <DialogActions>
                {user
                    ? <Button onClick={handlePost} disabled={!canPost}>发布</Button>
                    : <Button onClick={() => router.push("/login")}>登录</Button>
                }
            </DialogActions>
        </ProgressSlider>
        {
            canRaiseRecent && <ImagesPopover
                open={Boolean(imageAnchor)}
                onClose={() => setAnchor(undefined)}
                onSelectImage={(image) => setTitleImage(image)}
                selected={titleImage}
                anchorEl={imageAnchor}
                onSelectUpload={(file) => setTitleUpload(file)}
                anchorOrigin={{
                    vertical: "bottom",
                    horizontal: "right"
                }}
                transformOrigin={{
                    vertical: "bottom",
                    horizontal: "right"
                }}
                PaperProps={{
                    sx: {maxHeight: "60%"}
                }}
            />
        }
    </>;


    if (fullscreen) {
        const puller =
            <Box sx={{
                width: 30,
                height: 6,
                backgroundColor: theme.palette.mode === 'light' ? grey[300] : grey[900],
                borderRadius: 3,
                position: 'absolute',
                top: 8,
                left: 'calc(50% - 15px)'
            }}/>;
        return (
            <SwipeableDrawer
                open={props.open}
                onClose={() => props.onClose()}
                onOpen={() => undefined}
                disableSwipeToOpen
                swipeAreaWidth={0}
                anchor="bottom"
                ModalProps={{keepMounted: true}}
                keepMounted={false}
                sx={{
                    "& .MuiPaper-root": {
                        borderTopRightRadius: 8,
                        borderTopLeftRadius: 8
                    }
                }}
            >
                {puller}
                <Box sx={{marginTop: '10px'}}>
                    {content}
                </Box>
            </SwipeableDrawer>
        )
    } else {
        return (
            <Dialog open={props.open} onClose={() => props.onClose()} keepMounted={false}>
                {content}
            </Dialog>
        )
    }
}

type ImagesPopoverProps = PopoverProps & {
    selected: ImageID | undefined,
    onSelectImage?: (image: ImageID) => void,
    onSelectUpload?: (file: File) => void
};

function ImagesPopover(props: ImagesPopoverProps): JSX.Element {
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

export function DraftDialog(props: DraftDialogProps): JSX.Element {
    return <>
        <GoogleReCaptchaProvider
            reCaptchaKey={props.recaptchaKey}
            language="zh-CN"
            useRecaptchaNet={true}
        >
            <RenderContent {...props}/>
        </GoogleReCaptchaProvider>
    </>
}
