import { WithLikes } from "../lib/db/remark";
import { Commentable, WithComments } from "../lib/db/comment";
import { useGoogleReCaptcha } from "react-google-recaptcha-v3";
import { useProfileContext } from "../lib/useUser";
import { ElementType, ReactNode } from "react";
import { getResponseRemark, reCaptchaNotReady } from "../lib/contract";
import * as React from "react";
import { useRequestResult } from "../lib/useRequestResult";
import { fetchApi, postComment } from "../lib/utility";
import {
    Card,
    CardActions,
    CardContent,
    CardProps,
    DialogContent,
    DialogTitle,
    Grid,
    IconButton,
    MenuProps,
    Skeleton,
    Tooltip,
    Typography,
    useTheme,
} from "@mui/material";
import FavoriteIcon from "@mui/icons-material/Favorite";
import MoreIcon from "@mui/icons-material/MoreVert";
import CommentIcon from "@mui/icons-material/CommentOutlined";
import ReplyIcon from "@mui/icons-material/Reply";

import LoginPopover from "./LoginPopover";
import { LazyAvatar } from "./LazyAvatar";
import { useRouter } from "next/router";
import AdaptiveDialog, { AdaptiveDialogProps } from "./AdaptiveDialog";
import { RenderingComment } from "./CommentCard";
import { ChatInputField } from "./ChatInputField";
import { CommentUtil } from "../lib/comment";

export interface RenderingReview extends WithLikes, WithComments {
    _id: string;
    raiser: UserID;
    raiserNick?: string;
    body: string;
}

export interface ReviewCardProps<M extends MenuProps> {
    data: RenderingReview;
    contextMenu?: ElementType<M>;
    contextMenuProps?: Omit<M, keyof MenuProps>;
    onReplied?: (reply: RenderingComment) => void;
    commentSectionDisabled?: boolean;
}

export function ReviewCardRoot<M extends MenuProps>(
    props: ReviewCardProps<M> & {
        fullWidth?: boolean;
        children?: ReactNode;
        collectionId: string;
        showContextMenu?: boolean;
        onContextMenu?: (show: boolean) => void;
    },
) {
    const { executeRecaptcha } = useGoogleReCaptcha();
    const { data } = props;

    const { user, isLoading: isUserLoading } = useProfileContext();
    const router = useRouter();

    const [anchor, setAnchor] = React.useState<HTMLElement | null>(null);
    const [menuAnchor, setMenuAnchor] = React.useState<HTMLElement | null>(
        null,
    );
    const [liked, setLiked] = React.useState(false);
    const [likes, setLikes] = React.useState(data.likes.length);
    const [replying, setReplying] = React.useState(false);

    const handleLikeRes = useRequestResult(() => {
        if (!liked) {
            setLikes(likes + 1);
        } else {
            setLikes(likes - 1);
        }
        setLiked(!liked);
    });

    React.useEffect(() => {
        if (!user) {
            setLiked(false);
        } else {
            setLiked(data.likes.includes(user._id));
        }
    }, [user, isUserLoading]);

    function handlePopoverClose() {
        setAnchor(null);
    }

    async function handleLike(event: React.MouseEvent<HTMLButtonElement>) {
        if (!user) {
            setAnchor(event.currentTarget);
        } else if (executeRecaptcha) {
            const mode = liked ? "none" : "like";
            const token = await executeRecaptcha();
            const res = await fetchApi(
                `/api/remark/${props.collectionId}/${mode}/${data._id}`,
                { token },
            );
            handleLikeRes(await getResponseRemark(res));
        } else {
            handleLikeRes(reCaptchaNotReady);
        }
    }

    function handleCommentSection() {
        router.push(`/comment/${data._id}`);
    }

    function handleReply(event: React.MouseEvent<HTMLButtonElement>) {
        if (!user) {
            setAnchor(event.currentTarget);
        } else {
            setReplying(true);
        }
    }

    return (
        <>
            <CardContent sx={{ paddingBottom: 0, overflowWrap: "anywhere" }}>
                {data.body}
            </CardContent>
            <CardActions>
                <Grid container ml={1}>
                    <Grid
                        item
                        flexGrow={props.fullWidth === false ? 0 : 1}
                        mr={props.fullWidth === false ? 3 : 0}
                    >
                        <Typography variant="body2" color="text.secondary">
                            {data.raiserNick ? data.raiserNick : data.raiser}
                        </Typography>
                    </Grid>
                    <Grid item alignItems="center" display="flex">
                        {props.children}
                        {isUserLoading ? (
                            <Skeleton
                                variant="rectangular"
                                width={120}
                                height={24}
                            />
                        ) : (
                            <>
                                <Tooltip title="回复">
                                    <IconButton onClick={handleReply}>
                                        <ReplyIcon />
                                    </IconButton>
                                </Tooltip>
                                {!props.commentSectionDisabled && (
                                    <Tooltip title="评论区">
                                        <IconButton
                                            onClick={handleCommentSection}
                                        >
                                            <CommentIcon />
                                        </IconButton>
                                    </Tooltip>
                                )}
                                <Tooltip title="喜欢">
                                    <IconButton onClick={handleLike}>
                                        <FavoriteIcon
                                            color={liked ? "error" : "inherit"}
                                        />
                                    </IconButton>
                                </Tooltip>
                                <Typography
                                    variant="caption"
                                    sx={{ mr: !props.contextMenu ? 2 : 0 }}
                                >
                                    {likes}
                                </Typography>
                                {props.contextMenu && (
                                    <Tooltip title="更多">
                                        <IconButton
                                            onClick={(ev) => {
                                                if (props.onContextMenu) {
                                                    props.onContextMenu(true);
                                                }
                                                setMenuAnchor(ev.currentTarget);
                                            }}
                                        >
                                            <MoreIcon />
                                        </IconButton>
                                    </Tooltip>
                                )}
                            </>
                        )}
                    </Grid>
                </Grid>
            </CardActions>

            <LoginPopover
                open={anchor != null}
                anchorEl={anchor}
                onClose={handlePopoverClose}
                anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
                transformOrigin={{ vertical: "top", horizontal: "right" }}
            />

            <ReplyDialog
                open={replying}
                onClose={() => setReplying(false)}
                onReplied={props.onReplied}
                to={props.data}
                toType={props.collectionId as Commentable}
            />

            {props.contextMenu &&
                React.createElement(props.contextMenu, {
                    open:
                        typeof props.showContextMenu === "boolean"
                            ? props.showContextMenu
                            : Boolean(menuAnchor),
                    anchorEl: menuAnchor,
                    transformOrigin: {
                        horizontal: "right",
                        vertical: "top",
                    },
                    onClose: () => {
                        setMenuAnchor(null);
                        props.onContextMenu?.call({}, false);
                    },
                    ...(props.contextMenuProps as any),
                })}
        </>
    );
}

interface ReviewCardPropsCompat extends CardProps {
    raiser: UserID;
    children: ReactNode;
    belowCard?: ReactNode;
    grow?: boolean;
}

export function ReviewCard(props: ReviewCardPropsCompat) {
    return (
        <Grid container>
            <Grid item mr={1} ml={1}>
                <LazyAvatar userId={props.raiser} link />
            </Grid>

            <Grid item flexGrow={props.grow !== false ? 1 : 0} mt={1}>
                <Card {...props} sx={{ ...props.sx, borderRadius: 2 }}>
                    {props.children}
                </Card>
                {props.belowCard}
            </Grid>
        </Grid>
    );
}

interface ReplyProps extends Omit<AdaptiveDialogProps, "children"> {
    onReplied?: (reply: RenderingComment) => void;
    to: RenderingReview;
    toType: Commentable;
}

function ReplyDialog({ onReplied, to, toType, ...others }: ReplyProps) {
    const { executeRecaptcha } = useGoogleReCaptcha();
    const { user } = useProfileContext();

    const [buf, setBuf] = React.useState("");
    const [sending, setSending] = React.useState(false);
    const [error, setError] = React.useState(false);
    const sendDisabled = React.useMemo(
        () => !CommentUtil.validBody(buf),
        [buf],
    );
    const theme = useTheme();
    const handleResult = useRequestResult<string>(async (_, id) => {
        others.onClose();
        onReplied?.call(
            {},
            CommentUtil.create(user!, buf, { id: to._id, type: toType }, id),
        );
    });
    const bubbleColor = React.useMemo(
        () =>
            theme.palette.mode === "dark"
                ? theme.palette.grey["800"]
                : theme.palette.grey["300"],
        [theme],
    );

    function handleInput(newValue: string) {
        const len = CommentUtil.checkLength(newValue);
        if (len <= CommentUtil.maxLength) {
            setBuf(newValue);
            setError(false);
        } else {
            setError(true);
        }
    }

    async function handleSend() {
        if (!executeRecaptcha) {
            handleResult(reCaptchaNotReady);
            return;
        }
        setSending(true);
        const token = await executeRecaptcha();
        const res = await postComment(toType, to._id, buf, token);
        if (res.ok) {
            const id = await res.text();
            handleResult({ success: true }, id);
        } else {
            handleResult(await getResponseRemark(res));
        }
        setSending(false);
    }

    return (
        <AdaptiveDialog {...others}>
            <DialogTitle>回复{to.raiserNick ?? to.raiser}</DialogTitle>
            <DialogContent>
                <ReviewCard
                    raiser={to.raiser}
                    grow={false}
                    sx={{ background: bubbleColor }}
                    elevation={0}
                >
                    <CardContent
                        sx={{ paddingBottom: 0, overflowWrap: "anywhere" }}
                    >
                        {to.body}
                    </CardContent>
                </ReviewCard>
                <ChatInputField
                    value={buf}
                    onValueChanged={handleInput}
                    onSend={handleSend}
                    isSending={sending}
                    revealed
                    revealingStart="center"
                    sendDisabled={sendDisabled}
                    sx={{ mt: 2 }}
                    error={error}
                />
            </DialogContent>
        </AdaptiveDialog>
    );
}
