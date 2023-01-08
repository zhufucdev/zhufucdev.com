import type {NextPage} from "next";
import * as React from "react";
import Typography from "@mui/material/Typography";
import {
    Button,
    Card,
    CardContent,
    CardMedia,
    Collapse,
    Divider,
    Grid,
    IconButton,
    IconButtonProps,
    styled,
    Box,
    Skeleton,
    Avatar,
    Stack,
    CardActions, Tooltip, useTheme,
} from "@mui/material";
import PlaceHolder from "../componenets/PlaceHolder";
import {motion} from "framer-motion";

import NoRecentsIcon from "@mui/icons-material/WifiTetheringOffOutlined";
import ExpandMoreIcon from "@mui/icons-material/ExpandMoreOutlined";
import BulbIcon from "@mui/icons-material/LightbulbOutlined";
import NoAccountsIcon from "@mui/icons-material/NoAccountsOutlined";
import ImplementedIcon from "@mui/icons-material/DoneAllOutlined";
import LikeIcon from '@mui/icons-material/ThumbUp';
import DislikeIcon from '@mui/icons-material/ThumbDown';
import FavoriteIcon from '@mui/icons-material/Favorite';

import {orange, green} from "@mui/material/colors";

import {cacheImage, getHumanReadableTime, getImageUri} from "../lib/utility";
import {getRecents, Recent} from "../lib/db/recent";
import {getInspirations, Inspiration} from "../lib/db/inspiration";
import LoginPopover from "../componenets/LoginPopover";
import styles from "../styles/Home.module.css";
import {getUser} from "../lib/db/user";
import {useUser} from "../lib/useUser";
import {Copyright} from "../componenets/Copyright";

const Home: NextPage<PageProps> = ({recents, inspirations}) => {
    return (
        <>
            <Stack spacing={2}>
                <RecentCards key="recents" data={recents}/>
                <InspirationCards key="inspirations" data={inspirations}/>
            </Stack>
            <Copyright/>
        </>
    );
};

type LocalRecent = Omit<Recent, "time"> & { time: string };

interface LocalUser {
    _id: string;
    nick: string;
    avatar?: string;
}

type LocalInspiration = Omit<Inspiration, "raiser"> & {
    raiser: LocalUser | null;
};

type PageProps = {
    recents: LocalRecent[];
    inspirations: LocalInspiration[];
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

function Subtitle(props: { children: React.ReactElement | string }) {
    const theme = useTheme()
    return (
        <Typography mb={1} variant="subtitle2" color={theme.palette.primary.main}>
            {props.children}
        </Typography>
    );
}

function RecentCard(props: { data: LocalRecent }) {
    const {data} = props;
    const imageUri = getImageUri(data.cover);

    const [expanded, setExpanded] = React.useState(false);
    const [imageCached, setCached] = React.useState(false);
    const [anchorEle, setAnchor] = React.useState<HTMLElement | null>(null);

    function handleExpansionClick() {
        setExpanded(!expanded);
    }

    function handlePopoverClose() {
        setAnchor(null);
    }

    function handleLike(event: React.MouseEvent<HTMLElement>) {
        setAnchor(event.currentTarget);
    }

    function handleDislike(event: React.MouseEvent<HTMLElement>) {
        setAnchor(event.currentTarget);
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
                        <IconButton aria-label="like"
                                    onClick={handleLike}>
                            <LikeIcon/>
                        </IconButton>
                    </Tooltip>
                    <Tooltip title="不喜欢">
                        <IconButton aria-label="dislike"
                                    onClick={handleDislike}>
                            <DislikeIcon/>
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

    const subtitle = <Subtitle key="subtitle-recents">近况</Subtitle>;

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

function InspirationCard(props: { data: LocalInspiration }): JSX.Element {
    const {data} = props;
    const {user} = useUser();

    const imageUri = data.raiser && data.raiser.avatar ? getImageUri(data.raiser.avatar) : null;
    const [loaded, setLoaded] = React.useState(false);
    const [anchor, setAnchor] = React.useState<HTMLElement | null>(null);
    const [liked, setLiked] = React.useState(user && user in data.likes);

    function handlePopoverClose() {
        setAnchor(null);
    }

    async function handleLike(event: React.MouseEvent<HTMLButtonElement>) {
        if (!user) {
            setAnchor(event.currentTarget);
        } else {
            const mode = liked ? 'dislike' : 'like';
            const res = await fetch('/api/remark/inspirations/' + mode + '/' + data._id);
            const {success} = await res.json();

            if (success) {
                setLiked(!liked)
            }
        }
    }

    React.useEffect(() => {
        if (imageUri) cacheImage(imageUri).then(() => setLoaded(true));
    });

    return (
        <>
            <Grid container>
                <Grid item mr={1} ml={1}>
                    {loaded ? (
                        imageUri ? (
                            <Avatar
                                alt={"avatar of " + data.raiser!.nick}
                                src={imageUri}
                                style={{width: 56, height: 56}}
                                key="avatar"
                            />
                        ) : (
                            <Avatar
                                sx={{bgcolor: orange[900], width: 56, height: 56}}
                                key="avatar-null">
                                <NoAccountsIcon/>
                            </Avatar>
                        )
                    ) : (
                        <Skeleton
                            variant="circular"
                            animation="wave"
                            key="avatar-skeleton"
                            width={56}
                            height={56}
                        />
                    )}
                </Grid>

                <Grid item flexGrow={1} mt={1}>
                    <Card sx={data.implemented ? {backgroundColor: green[600]} : {}}>
                        <CardContent sx={{paddingBottom: 0}}>{data.body}</CardContent>
                        <CardActions>
                            <Grid container ml={1}>
                                <Grid item flexGrow={1}>
                                    <Typography variant="body2" color="text.secondary">
                                        {data.raiser?.nick}
                                    </Typography>
                                </Grid>
                                <Grid item alignItems="center" sx={{display: "flex"}}>
                                    {data.implemented ? (
                                        <Tooltip title="已实现">
                                            <ImplementedIcon aria-label="implemented"/>
                                        </Tooltip>
                                    ) : null}
                                    <Tooltip title="喜欢">
                                        <IconButton aria-label="like" onClick={handleLike}>
                                            <FavoriteIcon/>
                                        </IconButton>
                                    </Tooltip>
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

function InspirationCards(props: { data: LocalInspiration[] }): JSX.Element {
    const {data} = props;
    const subtitle = <Subtitle key="subtitle-inspirations">灵感</Subtitle>;

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

export async function getServerSideProps(): Promise<{ props: PageProps }> {
    const recents = (await getRecents()).map((v) => {
        return {...v, time: v.time.toISOString()};
    });

    const nullUser: LocalUser = {
        nick: "null",
        _id: "null",
        avatar: undefined
    }
    const inspirations: LocalInspiration[] = [];
    for (let i of await getInspirations()) {
        const raiser = await getUser(i.raiser);
        inspirations.push({
            ...i,
            raiser: raiser ? {
                nick: raiser.nick,
                _id: raiser._id,
                avatar: raiser.avatar
            } : nullUser
        });
    }

    return {
        props: {
            recents,
            inspirations,
        },
    };
}

export default Home;
