import {GetStaticProps, NextPage} from "next";
import {listArticles} from "../../lib/db/article";
import {
    Card,
    CardActionArea,
    CardContent,
    CardHeader,
    CardMedia, CircularProgress,
    Grid,
    IconButton,
    Menu,
    MenuItem, MenuList,
    MenuProps,
    Skeleton
} from "@mui/material";
import Typography from "@mui/material/Typography";
import ListItemText from "@mui/material/ListItemText";
import {Copyright} from "../../componenets/Copyright";
import {Scaffold} from "../../componenets/Scaffold";
import {isMe, useProfile, useUser} from "../../lib/useUser";
import {useRouter} from "next/router";
import {useTitle} from "../../lib/useTitle";
import {cacheImage, getHumanReadableTime, getImageUri, remark} from "../../lib/utility";
import React, {useEffect, useMemo, useState} from "react";
import {getSafeArticle, SafeArticle} from "../../lib/getSafeArticle";
import Link from "next/link";
import ListItemIcon from "@mui/material/ListItemIcon";
import {getResponseRemark, hasPermission, reCaptchaNotReady} from "../../lib/contract";

import {getUsers, User} from "../../lib/db/user";
import {useSnackbar} from "notistack";
import PlaceHolder from "../../componenets/PlaceHolder";
import EditIcon from "@mui/icons-material/EditOutlined";
import DeleteIcon from "@mui/icons-material/DeleteOutline";
import DropdownMenuIcon from "@mui/icons-material/MoreVertOutlined";
import NoArticleIcon from "@mui/icons-material/PsychologyOutlined";
import LikeIcon from "@mui/icons-material/ThumbUp";
import DislikeIcon from "@mui/icons-material/ThumbDown";
import {useRequestResult} from "../../lib/useRequestResult";
import LoginPopover from "../../componenets/LoginPopover";
import {ReCaptchaPolicy} from "../../componenets/ReCaptchaPolicy";
import {ReCaptchaScope} from "../../componenets/ReCaptchaScope";
import {useGoogleReCaptcha} from "react-google-recaptcha-v3";

type PageProps = {
    articles: RenderingArticle[],
    recaptchaKey: string,
}

const PostPage: NextPage<PageProps> = (props) => {
    const {user} = useUser();
    const router = useRouter();
    useTitle('文章')
    return <ReCaptchaScope reCaptchaKey={props.recaptchaKey}>
        <Scaffold
            fabContent={user && isMe(user) && <>
                <EditIcon sx={{mr: 1}}/>
                草拟
            </>}
            spacing={1}
            onFabClick={() => router.push('/article/edit')}
        >
            <Content articles={props.articles}/>
            <ReCaptchaPolicy sx={{textAlign: 'center'}}/>
            <Copyright/>
        </Scaffold>
    </ReCaptchaScope>
}

type IMenuBaseProps = {
    user: User | undefined,
    article: RenderingArticle
}

type IMenuProps = Omit<MenuProps, "children"> & IMenuBaseProps;
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

    if (!canEdit) {
        return (
            <Menu {...props}>
                <MenuList>
                    <PopoverBasics {...props} like={like} dislike={dislike}/>
                </MenuList>
            </Menu>
        );
    }
    return (
        <Menu {...props}>
            <MenuList>
                <MenuItem onClick={() => router.push(`/article/edit?id=${props.article._id}`)}>
                    <ListItemIcon><EditIcon/></ListItemIcon>
                    <ListItemText>编辑</ListItemText>
                </MenuItem>
                <MenuItem onClick={handleDelete}>
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
    )
}

function ArticleCard(props: { data: RenderingArticle }): JSX.Element {
    const {data} = props;
    const [coverCached, setCached] = useState(false);
    const [popoverAnchor, setAnchor] = useState<HTMLElement>();
    useEffect(() => {
        if (data.cover)
            cacheImage(getImageUri(data.cover)).then(() => setCached(true));
    }, [data.cover]);
    const self = useProfile();

    function handlePopoverActivatorClick(ev: React.MouseEvent<HTMLElement>) {
        ev.preventDefault();
        setAnchor(ev.currentTarget);
    }

    return <>
        <Card variant="outlined" sx={{borderRadius: 2}}>
            <CardActionArea component={Link} href={`/article/${data._id}`}>
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

function Content(props: { articles: RenderingArticle[] }): JSX.Element {
    if (props.articles.length > 0) {
        return (
            <Grid container spacing={2} key="grid">
                {props.articles.map(data => (
                    <Grid item key={data._id} flexGrow={1}>
                        <ArticleCard data={data}/>
                    </Grid>
                ))}
            </Grid>
        )
    } else {
        return (
            <PlaceHolder icon={NoArticleIcon} title="未提供文章"/>
        )
    }
}

interface RenderingArticle extends SafeArticle {
    authorNick?: string | undefined
}

export const getStaticProps: GetStaticProps<PageProps> = async () => {
    const articles = await listArticles()
        .then(list => list.sort(
            (a, b) =>
                Math.log(b.likes.length + 1) - Math.log(b.dislikes.length + 1)
                - Math.log(a.likes.length + 1) + Math.log(a.dislikes.length + 1)
        ));
    const users = await getUsers(articles.map(m => m.author));
    const unfolded: RenderingArticle[] = articles.map(m => users(m.author) ? {
        ...getSafeArticle(m),
        authorNick: users(m.author)!.nick
    } : getSafeArticle(m));

    return {
        props: {
            articles: unfolded,
            recaptchaKey: process.env.RECAPTCHA_KEY_FRONTEND as string
        }
    }
}

export default PostPage;