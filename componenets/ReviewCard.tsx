import { WithLikes } from "../lib/db/remark";
import { WithComments } from "../lib/db/comment";
import { useGoogleReCaptcha } from "react-google-recaptcha-v3";
import { useProfileContext } from "../lib/useUser";
import { ElementType, ReactNode, useEffect, useMemo } from "react";
import {
    getResponseRemark,
    hasPermission,
    reCaptchaNotReady,
} from "../lib/contract";
import * as React from "react";
import { useRequestResult } from "../lib/useRequestResult";
import { fetchApi } from "../lib/utility";
import {
    Card,
    CardActions,
    CardContent,
    Grid,
    IconButton,
    MenuProps,
    Skeleton,
    SxProps,
    Tooltip,
    Typography,
} from "@mui/material";
import FavoriteIcon from "@mui/icons-material/Favorite";
import MoreIcon from "@mui/icons-material/MoreVert";
import CommentIcon from "@mui/icons-material/CommentOutlined";

import LoginPopover from "./LoginPopover";
import { LazyAvatar } from "./LazyAvatar";
import { useRouter } from "next/router";

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

    const handleLikeRes = useRequestResult(() => {
        if (!liked) {
            setLikes(likes + 1);
        } else {
            setLikes(likes - 1);
        }
        setLiked(!liked);
    });

    useEffect(() => {
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

    function handleComment() {
        router.push(`/comment/${props.collectionId}/${data._id}`);
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
                                    <IconButton onClick={handleComment}>
                                        <CommentIcon />
                                    </IconButton>
                                </Tooltip>
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

interface ReviewCardPropsCompat {
    sx?: SxProps;
    raiser: UserID;
    children: ReactNode;
}

export function ReviewCard(props: ReviewCardPropsCompat) {
    return (
        <Grid container>
            <Grid item mr={1} ml={1}>
                <LazyAvatar userId={props.raiser} link />
            </Grid>

            <Grid item flexGrow={1} mt={1}>
                <Card sx={{ ...props.sx, borderRadius: 2 }}>
                    {props.children}
                </Card>
            </Grid>
        </Grid>
    );
}
