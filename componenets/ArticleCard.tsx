import React, {useEffect, useMemo, useState} from "react";
import {cacheImage, getHumanReadableTime, getImageUri, remark} from "../lib/utility";
import {useProfileContext} from "../lib/useUser";
import {
    Card,
    CardActionArea,
    CardContent,
    CardHeader,
    CardMedia, CircularProgress,
    IconButton,
    Menu, MenuItem,
    MenuList, MenuProps,
    Skeleton, SxProps
} from "@mui/material";
import Link from "next/link";
import DropdownMenuIcon from "@mui/icons-material/MoreVertOutlined";
import Typography from "@mui/material/Typography";
import LoginPopover from "./LoginPopover";
import {SafeArticle} from "../lib/getSafeArticle";
import {useRouter} from "next/router";
import {getResponseRemark, hasPermission, reCaptchaNotReady} from "../lib/contract";
import {useSnackbar} from "notistack";
import ListItemIcon from "@mui/material/ListItemIcon";
import EditIcon from "@mui/icons-material/EditOutlined";
import ListItemText from "@mui/material/ListItemText";
import DeleteIcon from "@mui/icons-material/DeleteOutline";
import {DeleteAlertDialog} from "./DeleteAlertDialog";
import {User} from "../lib/db/user";
import {useGoogleReCaptcha} from "react-google-recaptcha-v3";
import {useRequestResult} from "../lib/useRequestResult";
import LikeIcon from "@mui/icons-material/ThumbUp";
import DislikeIcon from "@mui/icons-material/ThumbDown";

export interface RenderingArticle extends SafeArticle {
    authorNick?: string | undefined
}

export function ArticleCard(props: { data: RenderingArticle, sx?: SxProps }): JSX.Element {
    const {data, sx} = props;
    const [coverCached, setCached] = useState(false);
    const [popoverAnchor, setAnchor] = useState<HTMLElement>();
    useEffect(() => {
        if (data.cover)
            cacheImage(getImageUri(data.cover)).then(() => setCached(true));
    }, [data.cover]);
    const self = useProfileContext();

    function handlePopoverActivatorClick(ev: React.MouseEvent<HTMLElement>) {
        ev.preventDefault();
        setAnchor(ev.currentTarget);
    }

    return <>
        <Card variant="outlined" sx={{borderRadius: 2, ...sx}}>
            <CardActionArea component={Link} href={`/article/${data._id}`} sx={{height: '100%'}}>
                <CardHeader
                    title={data.title}
                    subheader={data.forward}
                    sx={{pb: 0}}
                    action={
                        <IconButton onClick={handlePopoverActivatorClick} disabled={self.isLoading}>
                            <DropdownMenuIcon/>
                        </IconButton>
                    }
                />
                {data.cover &&
                    (coverCached ?
                            <CardMedia
                                component="img"
                                src={getImageUri(data.cover)}
                                alt="文章封面"
                                style={{height: 140}}/>
                            : <Skeleton variant="rectangular" animation="wave" height={140}/>
                    )}
                <CardContent sx={{pt: 0}}>
                    <Typography variant="caption" color="text.secondary">
                        由{data.authorNick ?? data.author}发布于{getHumanReadableTime(new Date(data.postTime))}
                    </Typography>
                </CardContent>
            </CardActionArea>
        </Card>
        {
            self.user
                ? <PopoverMenu
                    open={Boolean(popoverAnchor)}
                    onClose={() => setAnchor(undefined)}
                    anchorEl={popoverAnchor}
                    user={self.user}
                    article={data}
                />
                : <LoginPopover
                    open={Boolean(popoverAnchor)}
                    onClose={() => setAnchor(undefined)}
                    anchorEl={popoverAnchor}
                />
        }
    </>
}

type IMenuProps = Omit<MenuProps, "children"> & IMenuBaseProps;

function PopoverMenu(props: IMenuProps): JSX.Element {
    const router = useRouter();
    const canEdit = useMemo(
        () =>
            (props.user
                && (hasPermission(props.user, 'post_article')
                    && hasPermission(props.user, 'edit_own_post')
                    && props.article.author === props.user._id
                    || hasPermission(props.user, 'modify')
                )) === true,
        [props.user]
    );
    const like = useState(false);
    const dislike = useState(false);
    const [deleting, setDeleting] = useState(false);
    const {enqueueSnackbar} = useSnackbar();

    useEffect(() => {
        if (!props.user) return;
        like[1](props.user && props.article.likes.includes(props.user._id));
        dislike[1](props.article.dislikes.includes(props.user._id));
    }, [props.user])

    async function handleDelete() {
        if (!canEdit) return;
        setDeleting(true);
        const res = await fetch(`/api/delete/articles/${props.article._id}`);
        switch (res.status) {
            case 400:
                enqueueSnackbar('bug', {variant: 'error'});
                break;
            case 401:
                enqueueSnackbar('咋回事？（未登录）', {variant: 'error'});
                break;
            case 403:
                enqueueSnackbar('咋回事？（没权限）', {variant: 'error'});
                break;
            case 500:
                enqueueSnackbar('该死，数据库未响应', {variant: 'error'});
                break;
            case 200:
                props.onClose?.call({}, {}, 'backdropClick');
                router.reload();
                break;
            default:
                enqueueSnackbar(`咋回事？（${await res.text()}）`, {variant: 'error'});
        }
        setDeleting(false);
    }

    const [toDelete, setToDelete] = useState(false);

    if (!canEdit) {
        return (
            <Menu {...props}>
                <MenuList>
                    <PopoverBasics {...props} like={like} dislike={dislike}/>
                </MenuList>
            </Menu>
        );
    }
    return <>
        <Menu {...props}>
            <MenuList>
                <MenuItem onClick={() => router.push(`/article/edit?id=${props.article._id}`)}>
                    <ListItemIcon><EditIcon/></ListItemIcon>
                    <ListItemText>编辑</ListItemText>
                </MenuItem>
                <MenuItem onClick={() => setToDelete(true)}>
                    <ListItemIcon>{
                        deleting
                            ? <CircularProgress variant="indeterminate" size={24}/>
                            : <DeleteIcon/>
                    }
                    </ListItemIcon>
                    <ListItemText>删除</ListItemText>
                </MenuItem>
                <PopoverBasics {...props} like={like} dislike={dislike}/>
            </MenuList>
        </Menu>
        <DeleteAlertDialog
            targetName={props.article.title}
            open={toDelete}
            onConfirm={handleDelete}
            onClose={() => setToDelete(false)}
            onCancel={props.onClose as any} // idk why they are not compatible
        />
    </>
}

type IMenuBaseProps = {
    user: User | undefined,
    article: RenderingArticle
}

type PopoverBasicProps = IMenuBaseProps & {
    like: [boolean, (value: boolean) => void],
    dislike: [boolean, (value: boolean) => void]
}

function PopoverBasics({article, like, dislike}: PopoverBasicProps): JSX.Element {
    const [liked, setLiked] = like;
    const [disliked, setDisliked] = dislike;
    const {executeRecaptcha} = useGoogleReCaptcha();
    const handleRemark = useRequestResult();

    async function handleLike() {
        let result: RequestResult;

        if (executeRecaptcha) {
            const token = await executeRecaptcha();
            if (!liked) {
                setLiked(true);
                setDisliked(false);
                result = await getResponseRemark(await remark('articles', article._id, token, 'like'));
            } else {
                setLiked(false);
                result = await getResponseRemark(await remark('articles', article._id, token, 'none'));
            }
        } else {
            result = reCaptchaNotReady;
        }

        handleRemark(result);
        if (!result.success) {
            setLiked(liked);
            setDisliked(disliked);
        }
    }

    async function handleDislike() {
        let result: RequestResult;

        if (executeRecaptcha) {
            const token = await executeRecaptcha();
            if (!disliked) {
                setDisliked(true);
                setLiked(false);
                result = await getResponseRemark(await remark('articles', article._id, token, 'dislike'));
            } else {
                setDisliked(false);
                result = await getResponseRemark(await remark('articles', article._id, token, 'none'));
            }
        } else {
            result = reCaptchaNotReady;
        }

        handleRemark(result);
        if (!result.success) {
            setLiked(liked);
            setDisliked(disliked);
        }
    }

    return <>
        <MenuItem onClick={handleLike}>
            <ListItemIcon>
                <LikeIcon color={liked ? "error" : "inherit"}/>
            </ListItemIcon>
            <ListItemText>喜欢</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleDislike}>
            <ListItemIcon>
                <DislikeIcon color={disliked ? "error" : "inherit"}/>
            </ListItemIcon>
            <ListItemText>不喜欢</ListItemText>
        </MenuItem>
    </>
}