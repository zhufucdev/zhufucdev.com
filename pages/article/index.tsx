import {GetStaticProps, NextPage} from "next";
import {ArticleMeta, listArticles} from "../../lib/db/article";
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
import {isMe, useProfile, useProfileOf, useUser} from "../../lib/useUser";
import {useRouter} from "next/router";
import {useTitle} from "../../lib/useTitle";
import {cacheImage, getHumanReadableTime, getImageUri, remark} from "../../lib/utility";
import React, {useEffect, useMemo, useState} from "react";
import {fromSaveArticle, getSafeArticle, SafeArticle} from "../../lib/getSafeArticle";
import Link from "next/link";
import ListItemIcon from "@mui/material/ListItemIcon";
import {getResponseRemark, hasPermission} from "../../lib/contract";

import {User} from "../../lib/db/user";
import {useSnackbar} from "notistack";
import PlaceHolder from "../../componenets/PlaceHolder";
import EditIcon from "@mui/icons-material/EditOutlined";
import DeleteIcon from "@mui/icons-material/DeleteOutline";
import DropdownMenuIcon from "@mui/icons-material/MoreVertOutlined";
import NoArticleIcon from "@mui/icons-material/PsychologyOutlined";
import LikeIcon from "@mui/icons-material/ThumbUp";
import DislikeIcon from "@mui/icons-material/ThumbDown";
import {useRequestResult} from "../../lib/useRequestResult";

type PageProps = {
    articles: SafeArticle[]
}

const PostPage: NextPage<PageProps> = (props) => {
    const {user} = useUser();
    const router = useRouter();
    useTitle('文章')
    return <Scaffold
        fabContent={user && isMe(user) && <>
            <EditIcon sx={{mr: 1}}/>
            草拟
        </>}
        spacing={1}
        onFabClick={() => router.push('/article/edit')}
    >
        <Content articles={props.articles.map(fromSaveArticle)}/>
        <Copyright/>
    </Scaffold>
}

type IMenuBaseProps = {
    user: User | undefined,
    article: ArticleMeta
}

type IMenuProps = Omit<MenuProps, "children"> & IMenuBaseProps;
type PopoverBasicProps = IMenuBaseProps & {
    like: [boolean, (value: boolean) => void],
    dislike: [boolean, (value: boolean) => void]
}

function PopoverBasics({article, like, dislike}: PopoverBasicProps): JSX.Element {
    const [liked, setLiked] = like;
    const [disliked, setDisliked] = dislike;
    const handleRemark = useRequestResult();

    async function handleLike() {
        let result: RequestResult;

        if (!liked) {
            setLiked(true);
            setDisliked(false);
            result = await getResponseRemark(await remark('articles', article._id, 'like'));
        } else {
            setLiked(false);
            result = await getResponseRemark(await remark('articles', article._id, 'none'));
        }

        handleRemark(result);
        if (!result.success) {
            setLiked(liked);
            setDisliked(disliked);
        }
    }

    async function handleDislike() {
        let result: RequestResult;

        if (!disliked) {
            setDisliked(true);
            setLiked(false);
            result = await getResponseRemark(await remark('articles', article._id, 'dislike'));
        } else {
            setDisliked(false);
            result = await getResponseRemark(await remark('articles', article._id, 'none'));
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

function ArticleCard(props: { data: ArticleMeta }): JSX.Element {
    const {data} = props;
    const [coverCached, setCached] = useState(false);
    const [popoverAnchor, setAnchor] = useState<HTMLElement>();
    useEffect(() => {
        if (data.cover)
            cacheImage(getImageUri(data.cover)).then(() => setCached(true));
    }, [data.cover]);
    const profile = useProfileOf(data.author);
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
                        <IconButton onClick={handlePopoverActivatorClick} disabled={!self.user}>
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
                        由{profile.user?.nick || data.author}发布于{getHumanReadableTime(data.postTime)}
                    </Typography>
                </CardContent>
            </CardActionArea>
        </Card>
        <PopoverMenu
            open={Boolean(popoverAnchor)}
            onClose={() => setAnchor(undefined)}
            anchorEl={popoverAnchor}
            user={self.user}
            article={data}
        />
    </>
}

function Content(props: { articles: ArticleMeta[] }): JSX.Element {
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

export const getStaticProps: GetStaticProps<PageProps> = async () => {
    const articles = await listArticles()
        .then(list => list.sort(
            (a, b) =>
                Math.log(b.likes.length + 1) - Math.log(b.dislikes.length + 1)
                - Math.log(a.likes.length + 1) + Math.log(a.dislikes.length + 1)
        ));

    return {
        props: {
            articles: articles.map(getSafeArticle)
        }
    }
}

export default PostPage;