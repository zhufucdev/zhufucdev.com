import type {NextPage} from "next";
import * as React from "react";
import {useEffect, useState} from "react";
import Typography from "@mui/material/Typography";
import {
    Box,
    Button,
    Card,
    CardActions,
    CardContent,
    CardMedia, Chip,
    Collapse, Dialog, DialogActions, DialogContent, DialogTitle,
    Divider,
    Grid,
    IconButton,
    IconButtonProps,
    Skeleton,
    Stack,
    styled, SwipeableDrawer, TextField,
    Tooltip, useMediaQuery,
    useTheme,
} from "@mui/material";
import PlaceHolder from "../componenets/PlaceHolder";
import {motion} from "framer-motion";

import NoRecentsIcon from "@mui/icons-material/WifiTetheringOffOutlined";
import ExpandMoreIcon from "@mui/icons-material/ExpandMoreOutlined";
import BulbIcon from "@mui/icons-material/LightbulbOutlined";
import ImplementedIcon from "@mui/icons-material/DoneAllOutlined";
import LikeIcon from '@mui/icons-material/ThumbUp';
import DislikeIcon from '@mui/icons-material/ThumbDown';
import FavoriteIcon from '@mui/icons-material/Favorite';
import EditIcon from '@mui/icons-material/Edit';
import MessageIcon from '@mui/icons-material/MailOutline';
import IssueIcon from '@mui/icons-material/Report';

import {green, grey} from "@mui/material/colors";

import {cacheImage, getHumanReadableTime, getImageUri, postMessage, remark} from "../lib/utility";
import {getRecents, Recent} from "../lib/db/recent";
import {getInspirations, Inspiration} from "../lib/db/inspiration";
import LoginPopover from "../componenets/LoginPopover";
import styles from "../styles/Home.module.css";
import {getUser} from "../lib/db/user";
import {useProfile, useUser} from "../lib/useUser";
import {Copyright} from "../componenets/Copyright";
import {Scaffold} from "../componenets/Scaffold";
import {Global} from "@emotion/react";
import {UserAvatar} from "../componenets/UserAvatar";
import {useRouter} from "next/router";
import {maxUserMessageLength} from "../lib/contract";
import {ProgressSlider} from "../componenets/PrograssSlider";
import {useSnackbar} from "notistack";
import {useRequestResult} from "../lib/useRequestResult";

const Home: NextPage<PageProps> = ({recents, inspirations}) => {
    const [draftOpen, setDraft] = useState(false);

    return (
        <>
            <Scaffold
                spacing={2}
                fab={
                    <>
                        <EditIcon sx={{mr: 1}}/>
                        草拟
                    </>
                }
                onFabClick={() => setDraft(true)}
            >
                <RecentCards key="recents" data={recents}/>
                <InspirationCards key="inspirations" data={inspirations}/>
            </Scaffold>
            <DraftDialog open={draftOpen} onClose={() => setDraft(false)}/>
            <Copyright/>
        </>
    );
};

type LocalRecent = Omit<Recent, "time"> & { time: string };

type PageProps = {
    recents: LocalRecent[];
    inspirations: Inspiration[];
};

interface ExpandMoreProps extends IconButtonProps {
    expand: boolean;
}

const ExpandMore = styled((props: ExpandMoreProps) => {
    const {expand, ...other} = props;
    return <IconButton {...other}/>;
})(({theme, expand}) => ({
    transform: !expand ? "rotate(0deg)" : "rotate(180deg)",
    marginLeft: "auto",
    transition: theme.transitions.create("transform", {
        duration: theme.transitions.duration.shortest,
    }),
}));

function Caption(props: { children: React.ReactElement | string }) {
    const theme = useTheme()
    return (
        <Typography mb={1} variant="subtitle2" color={theme.palette.primary.main}>
            {props.children}
        </Typography>
    );
}

function RecentCard(props: { data: LocalRecent }) {
    const {data} = props;
    const {user, isLoading: isUserLoading} = useUser();
    const imageUri = getImageUri(data.cover);

    const [expanded, setExpanded] = React.useState(false);
    const [imageCached, setCached] = React.useState(false);
    const [anchorEle, setAnchor] = React.useState<HTMLElement | null>(null);

    const [like, setLike] = useState(false);
    const [dislike, setDislike] = useState(false);
    useEffect(() => {
        if (!user) return;
        setLike(data.likes.includes(user));
        setDislike(data.dislikes.includes(user));
    }, [user, isUserLoading]);

    function handleExpansionClick() {
        setExpanded(!expanded);
    }

    function handlePopoverClose() {
        setAnchor(null);
    }

    async function handleLike(event: React.MouseEvent<HTMLElement>) {
        if (!user) {
            setAnchor(event.currentTarget);
        } else if (!like) {
            await remark("recents", data._id, "like");
            setLike(true);
            setDislike(false);
        } else {
            await remark("recents", data._id, "none");
            setLike(false);
        }
    }

    async function handleDislike(event: React.MouseEvent<HTMLElement>) {
        if (!user) {
            setAnchor(event.currentTarget);
        } else if (!dislike) {
            await remark("recents", data._id, "dislike");
            setDislike(true);
            setLike(false);
        } else {
            await remark("recents", data._id, "none");
            setDislike(false);
        }
    }

    React.useEffect(() => {
        cacheImage(imageUri).then(() => setCached(true));
    });

    return (
        <>
            <Card>
                {imageCached ? (
                    <CardMedia
                        component="img"
                        height={140}
                        sx={{objectFit: "cover"}}
                        alt="recent cover"
                        image={imageUri}
                    />
                ) : (
                    <Skeleton sx={{height: 140}} animation="wave" variant="rectangular"/>
                )}

                <CardContent>
                    <Typography variant="h5" gutterBottom>
                        {data.title}
                    </Typography>
                    <Typography variant="body2">{data.body}</Typography>
                </CardContent>
                <CardActions disableSpacing className={styles.mWithoutTop}>
                    <Tooltip title="喜欢">
                        <IconButton aria-label="like" disabled={isUserLoading}
                                    onClick={handleLike}>
                            <LikeIcon color={like ? 'primary' : 'inherit'}/>
                        </IconButton>
                    </Tooltip>
                    <Tooltip title="不喜欢">
                        <IconButton aria-label="dislike" disabled={isUserLoading}
                                    onClick={handleDislike}>
                            <DislikeIcon color={dislike ? 'primary' : 'inherit'}/>
                        </IconButton>
                    </Tooltip>
                    <ExpandMore
                        onClick={handleExpansionClick}
                        expand={expanded}
                        aria-expanded={expanded}
                        aria-label="more nonsense">
                        <ExpandMoreIcon/>
                    </ExpandMore>
                </CardActions>

                <Collapse in={expanded} timeout="auto" unmountOnExit>
                    <Divider/>
                    <CardContent>
                        <Typography variant="body2" color="text.secondary">
                            <i>发布于{getHumanReadableTime(new Date(data.time))}</i>
                        </Typography>
                    </CardContent>
                </Collapse>
            </Card>

            <LoginPopover
                open={anchorEle != null}
                anchorEl={anchorEle}
                onClose={handlePopoverClose}
                anchorOrigin={{vertical: "bottom", horizontal: "left"}}
                transformOrigin={{vertical: "top", horizontal: "left"}}
            />
        </>
    );
}

function RecentCards(props: { data: LocalRecent[] }): JSX.Element {
    const {data} = props;

    const subtitle = <Caption key="subtitle-recents">近况</Caption>;

    const [more, setMore] = React.useState(false);

    function handleShowMoreClick() {
        setMore(true);
    }

    if (data.length > 1) {
        return (
            <Box>
                {subtitle}
                <Grid
                    container
                    spacing={2}
                    sx={{display: {md: "flex", sm: "block", xs: "block"}}}>
                    {data.map((e, i) =>
                        i == 0 ? (
                            <Grid item sx={{flex: 1}} key={"entry-" + i}>
                                <RecentCard data={e}/>
                            </Grid>
                        ) : (
                            <>
                                <Grid
                                    item
                                    sx={{flex: 1}}
                                    component={motion.div}
                                    key={"entry-" + i}
                                    variants={{
                                        shown: {y: 0, opacity: 1, display: "block"},
                                        hidden: {y: -10, opacity: 0, display: "none"},
                                    }}
                                    animate={more ? "shown" : "hidden"}
                                    transition={{ease: "easeInOut", duration: 0.2}}
                                >
                                    <RecentCard data={e}/>
                                </Grid>
                                <Grid
                                    item
                                    sx={{
                                        flex: 1,
                                        display: more
                                            ? "none"
                                            : {md: "block", sm: "none", xs: "none"},
                                    }}
                                    key={"on-large-" + i}
                                >
                                    <RecentCard data={e}/>
                                </Grid>
                            </>
                        )
                    )}
                </Grid>
                <Box
                    sx={{
                        display: {md: "none", sm: "flex", xs: "flex"},
                        flexDirection: "row-reverse",
                        mt: 1,
                    }}
                    component={motion.div}
                    variants={{
                        shown: {opacity: 1},
                        hidden: {opacity: 0, display: "none"},
                    }}
                    animate={more ? "hidden" : "shown"}
                    transition={{duration: 0.2}}
                >
                    <Button variant="text" onClick={handleShowMoreClick}>
                        更多
                    </Button>
                </Box>
            </Box>
        );
    }
    if (data.length > 0) {
        return <RecentCard data={data[0]}/>;
    } else {
        return (
            <Box>
                {subtitle}
                <PlaceHolder icon={NoRecentsIcon} title="未更新近况"/>
            </Box>
        );
    }
}

function InspirationCard(props: { data: Inspiration }): JSX.Element {
    const {data} = props;
    const {user, isLoading: isUserLoading} = useUser();
    const raiser = useProfile(data.raiser);

    const [anchor, setAnchor] = React.useState<HTMLElement | null>(null);
    const [liked, setLiked] = React.useState(false);
    const [likes, setLikes] = React.useState(data.likes.length);

    useEffect(() => {
        if (!user) return;
        setLiked(data.likes.includes(user));
    }, [user, isUserLoading]);

    function handlePopoverClose() {
        setAnchor(null);
    }

    async function handleLike(event: React.MouseEvent<HTMLButtonElement>) {
        if (!user) {
            setAnchor(event.currentTarget);
        } else {
            const mode = liked ? 'none' : 'like';
            const res = await fetch('/api/remark/inspirations/' + mode + '/' + data._id);
            const {success} = await res.json();

            if (success) {
                if (!liked) {
                    setLikes(likes + 1);
                } else {
                    setLikes(likes - 1);
                }
                setLiked(!liked);
            }
        }
    }

    return (
        <>
            <Grid container>
                <Grid item mr={1} ml={1}>
                    <UserAvatar user={data.raiser}/>
                </Grid>

                <Grid item flexGrow={1} mt={1}>
                    <Card sx={data.implemented ? {backgroundColor: green[600]} : {}}>
                        <CardContent sx={{paddingBottom: 0}}>{data.body}</CardContent>
                        <CardActions>
                            <Grid container ml={1}>
                                <Grid item flexGrow={1}>
                                    <Typography variant="body2" color="text.secondary">
                                        {raiser ? raiser.nick : data.raiser}
                                    </Typography>
                                </Grid>
                                <Grid item alignItems="center" sx={{display: "flex"}}>
                                    {data.implemented ? (
                                        <Tooltip title="已实现">
                                            <ImplementedIcon aria-label="implemented"/>
                                        </Tooltip>
                                    ) : null}
                                    <Tooltip title="喜欢">
                                        <IconButton aria-label="like" onClick={handleLike} disabled={isUserLoading}>
                                            <FavoriteIcon color={liked ? 'error' : 'inherit'}/>
                                        </IconButton>
                                    </Tooltip>
                                    <Typography variant="caption" style={{marginRight: 12}}>
                                        {likes}
                                    </Typography>
                                </Grid>
                            </Grid>
                        </CardActions>
                    </Card>
                </Grid>
            </Grid>
            <LoginPopover
                open={anchor != null}
                anchorEl={anchor}
                onClose={handlePopoverClose}
                anchorOrigin={{vertical: "bottom", horizontal: "right"}}
                transformOrigin={{vertical: "top", horizontal: "right"}}
            />
        </>
    );
}

function InspirationCards(props: { data: Inspiration[] }): JSX.Element {
    const {data} = props;
    const subtitle = <Caption key="subtitle-inspirations">灵感</Caption>;

    if (data.length > 0) {
        return (
            <Stack spacing={1}>
                {subtitle}
                {data.map((e, i) => (
                    <InspirationCard data={e} key={i}/>
                ))}
            </Stack>
        );
    } else {
        return (
            <Box>
                {subtitle}
                <PlaceHolder icon={BulbIcon} title="未提供灵感"/>
            </Box>
        );
    }
}

function DraftDialog(props: { open: boolean, onClose: () => void }): JSX.Element {
    const theme = useTheme();
    const router = useRouter();
    const {user} = useUser();
    const handleResult = useRequestResult(
        () => {
            setPosted(true);
            localStorage.setItem(storageKey, '');
            setDraft('');
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

    useEffect(() => {
        if (!user) return;
        const stored = localStorage.getItem(storageKey);
        if (stored) setDraft(stored);
    });

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
    }

    async function handlePost() {
        setPosting(true);
        const res = await postMessage(type, draft);
        let result: RequestResult;
        if (res.ok) {
            result = {success: true}
        } else {
            switch (res.status) {
                case 401:
                    result = {
                        success: false,
                        respond: await res.text(),
                        msg: "一个bug导致你未登录"
                    }
                    break;
                case 400:
                    result = {
                        success: false,
                        respond: await res.text(),
                        msg: "bug"
                    }
                    break;
                case 500:
                    result = {
                        success: false,
                        respond: await res.text(),
                        msg: "一个bug导致数据库未响应"
                    }
                    break;
                default:
                    result = {
                        success: false,
                        respond: await res.text(),
                        msg: "咋回事？"
                    }
            }
        }
        handleResult(result);
        setTimeout(() => {
            props.onClose();
            reset();
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
                                   helperText={`${draft.length} / ${maxUserMessageLength}`}
                                   error={draft.length >= maxUserMessageLength}
                        />
                    </Stack>
                </Stack>
            </DialogContent>
            <DialogActions>
                {user
                    ? <Button onClick={handlePost}>发布</Button>
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
            <>
                <Global
                    styles={{
                        '.MuiDrawer-root > .MuiPaper-root': {
                            overflow: 'visible',
                            borderTopLeftRadius: 8,
                            borderTopRightRadius: 8
                        },
                    }}
                />
                <SwipeableDrawer
                    open={props.open}
                    onClose={props.onClose}
                    onOpen={() => undefined}
                    disableSwipeToOpen
                    swipeAreaWidth={0}
                    anchor="bottom"
                    ModalProps={{keepMounted: true}}
                    keepMounted={false}
                >
                    {puller}
                    <Box sx={{marginTop: '10px'}}>
                        {content}
                    </Box>
                </SwipeableDrawer>
            </>
        )
    } else {
        return (
            <Dialog open={props.open} onClose={props.onClose} keepMounted={false}>
                {content}
            </Dialog>
        )
    }
}

export async function getServerSideProps(): Promise<{ props: PageProps }> {
    const recents = (await getRecents()).map((v) => {
        return {...v, time: v.time.toISOString(), likes: v.likes ?? [], dislikes: v.dislikes ?? []};
    });
    const inspirations = await getInspirations();

    return {
        props: {
            recents,
            inspirations,
        },
    };
}

export default Home;
