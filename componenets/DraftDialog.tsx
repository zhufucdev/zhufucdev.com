import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Collapse from "@mui/material/Collapse";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";

import {useRouter} from "next/router";
import {useProfileContext} from "../lib/useUser";
import {useRequestResult} from "../lib/useRequestResult";
import * as React from "react";
import {useEffect, useMemo, useState} from "react";
import {getResponseRemark, hasPermission, maxUserMessageLength,} from "../lib/contract";
import {beginPost, postMessage, uploadImage} from "../lib/utility";
import {ProgressSlider} from "./PrograssSlider";
import {LazyAvatar} from "./LazyAvatar";
import {useGoogleReCaptcha} from "react-google-recaptcha-v3";

import BulbIcon from "@mui/icons-material/LightbulbOutlined";
import MessageIcon from "@mui/icons-material/MailOutline";
import IssueIcon from "@mui/icons-material/Report";
import RecentIcon from "@mui/icons-material/Podcasts";
import ImageIcon from "@mui/icons-material/ImageOutlined";
import {ImagesPopover} from "./ImagesPopover";
import {User} from "../lib/db/user";
import AdaptiveDialog, {AdaptiveDialogProps} from "./AdaptiveDialog";

type DraftDialogProps = Omit<AdaptiveDialogProps, 'children'> & {
    onPosted: (
        type: MessageType,
        id: any,
        raiser: User,
        content: MessageContent,
    ) => void;
};

export function DraftDialog(props: DraftDialogProps): JSX.Element {
    const router = useRouter();
    const {user} = useProfileContext();
    const {executeRecaptcha} = useGoogleReCaptcha();
    const handleResult = useRequestResult(
        () => setPosted(true),
        () => setFailed(true),
    );
    const bodyStorageKey = "messageDraft";
    const titleStorageKey = "titleDraft";

    const [posting, setPosting] = useState(false);
    const [posted, setPosted] = useState(false);
    const [failed, setFailed] = useState(false);
    const [type, setType] = useState<MessageType>("inspiration");
    const [title, setTitle] = useState("");
    const [draft, setDraft] = useState("");
    const [wordCount, setWordCount] = useState(0);

    const [imageAnchor, setAnchor] = useState<HTMLElement>();
    const [titleImage, setTitleImage] = useState<ImageID>();
    const [titleUpload, setTitleUpload] = useState<File>();
    const canRaiseRecent = useMemo(
        () => user && hasPermission(user, "raise_recent"),
        [user],
    );

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
        let draft: string;
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
            setDraft("");
            localStorage.setItem(bodyStorageKey, "");
            setTitle("");
            localStorage.setItem(titleStorageKey, "");
        }
    }

    async function makePostRequest(
        token: string,
        ref: string,
    ): Promise<{ response: Response; content?: MessageContent }> {
        if (type === "recent") {
            let imageId: ImageID;
            if (titleImage === "upload") {
                if (!titleUpload) throw new Error("no uploading candidate");
                const res = await uploadImage(titleUpload, token, "post", [
                    ref,
                ]);
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
                response: await postMessage(type, ref, content, token),
                content,
            };
        } else {
            const content = {body: draft};
            return {
                response: await postMessage(type, ref, content, token),
                content,
            };
        }
    }

    async function handlePost() {
        if (!executeRecaptcha) return;
        setPosting(true);
        const token = await executeRecaptcha();
        const ref = await beginPost(type);
        const {response: res, content} = await makePostRequest(token, ref);
        let result: RequestResult;
        if (res.ok) {
            result = {success: true, respond: await res.text()};
        } else {
            result = await getResponseRemark(res);
        }
        handleResult(result);
        setTimeout(() => {
            props.onClose();
            if (result.success) {
                props.onPosted(type, ref, user!, content!);
            }
            setTimeout(() => reset(result.success), 1000);
        }, 2000);
    }

    function DraftChip(props: {
        label: string;
        type: MessageType;
        permit: PermissionID;
        icon: React.ReactElement;
        hide?: boolean;
    }): JSX.Element {
        const permitted = user && hasPermission(user, props.permit);
        if (props.hide && !permitted) {
            return <></>;
        }
        return (
            <Chip
                label={props.label}
                variant={type === props.type ? "filled" : "outlined"}
                color={type === props.type ? "primary" : "default"}
                onClick={() => setType(props.type)}
                icon={props.icon}
                key={type}
                disabled={!permitted}
            />
        );
    }

    const chips = (
        <Stack direction="row" spacing={1} sx={{overflowX: "auto"}}>
            <DraftChip
                label="近况"
                type="recent"
                permit="raise_recent"
                icon={<RecentIcon fontSize="small"/>}
                hide
            />
            <DraftChip
                label="灵感"
                type="inspiration"
                permit="raise_inspiration"
                icon={<BulbIcon fontSize="small"/>}
            />
            <DraftChip
                label="私信"
                type="pm"
                permit="send_pm"
                icon={<MessageIcon fontSize="small"/>}
            />
            <DraftChip
                label="提问"
                type="issue"
                permit="raise_issue"
                icon={<IssueIcon fontSize="small"/>}
            />
        </Stack>
    );

    const inputs = (
        <Stack direction="row" spacing={2}>
            <LazyAvatar user={user} size={48} sx={{mt: 0.2, ml: 0.2}}/>
            <Stack spacing={1} width="100%">
                <Collapse appear={false} in={type === "recent"} mountOnEnter>
                    <TextField
                        variant="outlined"
                        label="标题"
                        type="text"
                        value={title}
                        fullWidth
                        onChange={handleTitleChange}
                        InputProps={{
                            endAdornment: (
                                <IconButton
                                    onClick={(ev) =>
                                        setAnchor(ev.currentTarget)
                                    }
                                >
                                    <ImageIcon/>
                                </IconButton>
                            ),
                        }}
                    />
                </Collapse>
                <TextField
                    variant="outlined"
                    label={user ? "发言" : "得先登录才能发言"}
                    value={user ? draft : ""}
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

    const canPost =
        wordCount > 0 &&
        ((type === "recent" && titleImage && title) || type !== "recent");
    return (
        <AdaptiveDialog {...props}>
            <ProgressSlider loading={posting} done={posted} error={failed}>
                <DialogTitle>简单说些什么</DialogTitle>
                <DialogContent>
                    <Stack spacing={2}>
                        {chips}
                        {inputs}
                    </Stack>
                </DialogContent>
                <DialogActions>
                    {user ? (
                        <Button onClick={handlePost} disabled={!canPost}>
                            发布
                        </Button>
                    ) : (
                        <Button onClick={() => router.push("/login")}>
                            登录
                        </Button>
                    )}
                </DialogActions>
            </ProgressSlider>
            {canRaiseRecent && (
                <ImagesPopover
                    open={Boolean(imageAnchor)}
                    onClose={() => setAnchor(undefined)}
                    onSelectImage={(image) => setTitleImage(image)}
                    selected={titleImage}
                    anchorEl={imageAnchor}
                    onSelectUpload={(file) => setTitleUpload(file)}
                    filter={(meta) => meta.use === "save"}
                    anchorOrigin={{
                        vertical: "bottom",
                        horizontal: "right",
                    }}
                    transformOrigin={{
                        vertical: "bottom",
                        horizontal: "right",
                    }}
                    slotProps={{
                        paper: {
                            sx: {maxHeight: "60%"}
                        },
                    }}
                />
            )}
        </AdaptiveDialog>
    );
}
