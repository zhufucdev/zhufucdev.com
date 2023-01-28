import {
    Box,
    Button,
    Chip,
    Collapse,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    IconButton,
    Stack,
    SwipeableDrawer,
    TextField,
    useMediaQuery,
    useTheme
} from "@mui/material";
import {useRouter} from "next/router";
import {useProfile} from "../lib/useUser";
import {useRequestResult} from "../lib/useRequestResult";
import * as React from "react";
import {useEffect, useMemo, useState} from "react";
import {getResponseRemark, hasPermission, maxUserMessageLength} from "../lib/contract";
import {postMessage, uploadImage} from "../lib/utility";
import {ProgressSlider} from "./PrograssSlider";
import {LazyAvatar} from "./LazyAvatar";
import {useGoogleReCaptcha} from "react-google-recaptcha-v3";
import {ReCaptchaPolicy} from "./ReCaptchaPolicy";

import BulbIcon from "@mui/icons-material/LightbulbOutlined";
import MessageIcon from "@mui/icons-material/MailOutline";
import IssueIcon from "@mui/icons-material/Report";
import RecentIcon from "@mui/icons-material/Podcasts";
import ImageIcon from "@mui/icons-material/ImageOutlined"
import {grey} from "@mui/material/colors";
import {ImagesPopover} from "./ImagesPopover";
import {ReCaptchaScope} from "./ReCaptchaScope";

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
            <LazyAvatar user={user} size={48} sx={{mt: 0.2, ml: 0.2}}/>
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

export function DraftDialog(props: DraftDialogProps): JSX.Element {
    return <>
        <ReCaptchaScope reCaptchaKey={props.recaptchaKey}>
            <RenderContent {...props}/>
        </ReCaptchaScope>
    </>
}
