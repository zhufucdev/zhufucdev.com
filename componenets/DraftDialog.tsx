import {
    Box,
    Button,
    Chip,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Stack,
    SwipeableDrawer,
    TextField,
    useMediaQuery,
    useTheme
} from "@mui/material";
import {useRouter} from "next/router";
import {useUser} from "../lib/useUser";
import {useRequestResult} from "../lib/useRequestResult";
import * as React from "react";
import {useEffect, useState} from "react";
import {getResponseRemark, maxUserMessageLength} from "../lib/contract";
import {postMessage} from "../lib/utility";
import {ProgressSlider} from "./PrograssSlider";
import BulbIcon from "@mui/icons-material/LightbulbOutlined";
import MessageIcon from "@mui/icons-material/MailOutline";
import IssueIcon from "@mui/icons-material/Report";
import {grey} from "@mui/material/colors";
import {UserAvatar} from "./UserAvatar";
import {GoogleReCaptchaProvider, useGoogleReCaptcha} from "react-google-recaptcha-v3";
import {ReCaptchaPolicy} from "./ReCaptchaPolicy";

type DraftDialogProps = {
    open: boolean,
    onClose: () => void,
    recaptchaKey: string,
    onPosted: (type: MessageType, id: any, raiser: UserID, content: string) => void
};

function RenderContent(props: DraftDialogProps): JSX.Element {
    const theme = useTheme();
    const router = useRouter();
    const {user} = useUser();
    const {executeRecaptcha} = useGoogleReCaptcha();
    const handleResult = useRequestResult(
        () => {
            setPosted(true);
            localStorage.setItem(storageKey, '');
        },
        () => setFailed(true)
    )
    const fullscreen = useMediaQuery(theme.breakpoints.down('md'));
    const storageKey = "messageDraft";

    const [posting, setPosting] = useState(false);
    const [posted, setPosted] = useState(false);
    const [failed, setFailed] = useState(false);
    const [type, setType] = useState<MessageType>('inspiration');
    const [draft, setDraft] = useState('');
    const [wordCount, setWordCount] = useState(0);

    useEffect(() => {
        if (!user) return;
        const stored = localStorage.getItem(storageKey);
        if (stored) setDraft(stored);
    });

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
        localStorage.setItem(storageKey, draft);
    }

    function reset() {
        setPosting(false);
        setPosted(false);
        setFailed(false);
        setDraft('');
    }

    async function handlePost() {
        if (!executeRecaptcha) return;
        setPosting(true);
        const token = await executeRecaptcha();
        const res = await postMessage(type, draft, token);
        let result: RequestResult;
        if (res.ok) {
            result = {success: true, respond: await res.text()}
        } else {
            result = await getResponseRemark(res);
        }
        handleResult(result);
        setTimeout(() => {
            props.onClose();
            if (result.success) props.onPosted(type, result.respond, user as string, draft);
            setTimeout(reset, 1000);
        }, 2000);
    }

    function DraftChip(props: { label: string, type: MessageType, icon: React.ReactElement }): JSX.Element {
        return (
            <Chip
                label={props.label}
                variant={type === props.type ? 'filled' : 'outlined'}
                color={type === props.type ? 'primary' : 'default'}
                onClick={() => setType(props.type)}
                icon={props.icon}
            />
        )
    }

    const content =
        <ProgressSlider loading={posting} done={posted} error={failed}>
            <DialogTitle>简单说些什么</DialogTitle>
            <DialogContent>
                <Stack spacing={2}>
                    <Stack direction="row" spacing={1}>
                        <DraftChip label="灵感" type="inspiration" icon={<BulbIcon fontSize="small"/>}/>
                        <DraftChip label="私信" type="pm" icon={<MessageIcon fontSize="small"/>}/>
                        <DraftChip label="提问" type="issue" icon={<IssueIcon fontSize="small"/>}/>
                    </Stack>
                    <Stack direction="row" spacing={2}>
                        <UserAvatar user={user} size={48} sx={{mt: 0.2, ml: 0.2}}/>
                        <TextField variant="outlined"
                                   label={user ? "留言" : "得先登录才能留言"}
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
                <ReCaptchaPolicy variant="body2"/>
            </DialogContent>
            <DialogActions>
                {user
                    ? <Button onClick={handlePost} disabled={wordCount <= 0}>发布</Button>
                    : <Button onClick={() => router.push("/login")}>登录</Button>
                }
            </DialogActions>
        </ProgressSlider>;

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
        <GoogleReCaptchaProvider
            reCaptchaKey={props.recaptchaKey}
            language="zh-CN"
            useRecaptchaNet={true}
        >
            <RenderContent {...props}/>
        </GoogleReCaptchaProvider>
    </>
}