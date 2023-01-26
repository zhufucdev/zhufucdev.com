import {useUser} from "../lib/useUser";
import {cacheImage, getHumanReadableTime, getImageUri, remark} from "../lib/utility";
import * as React from "react";
import {useEffect, useState} from "react";
import {
    Card,
    CardActions,
    CardContent,
    CardMedia,
    Collapse,
    Divider,
    IconButton, IconButtonProps,
    Skeleton, styled,
    Tooltip,
    Typography
} from "@mui/material";
import styles from "../styles/Home.module.css";
import LikeIcon from "@mui/icons-material/ThumbUp";
import DislikeIcon from "@mui/icons-material/ThumbDown";
import ExpandMoreIcon from "@mui/icons-material/ExpandMoreOutlined";
import LoginPopover from "./LoginPopover";
import {LocalRecent} from "../pages";
import {useRequestResult} from "../lib/useRequestResult";
import {getResponseRemark} from "../lib/contract";
import {MarkdownScope} from "./MarkdownScope";

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


export function RecentCard(props: { data: LocalRecent }) {
    const {data} = props;
    const {user, isLoading: isUserLoading} = useUser();
    const imageUri = getImageUri(data.cover);

    const [like, setLike] = useState(false);
    const [dislike, setDislike] = useState(false);
    const handleLikeResult = useRequestResult(
        () => {
            if (!like) {
                setLike(true);
                setDislike(false);
            } else {
                setLike(false);
            }
        }
    );
    const handleDislikeResult = useRequestResult(
        () => {
            if (!dislike) {
                setDislike(true);
                setLike(false);
            } else {
                setDislike(false);
            }
        }
    );

    const [expanded, setExpanded] = React.useState(false);
    const [imageCached, setCached] = React.useState(false);

    const [anchorEle, setAnchor] = React.useState<HTMLElement | null>(null);
    useEffect(() => {
        if (!user) {
            setLike(false);
            setDislike(false);
        } else {
            setLike(data.likes.includes(user));
            setDislike(data.dislikes.includes(user));
        }
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
        } else {
            if (!like) {
                const res = await remark("recents", data._id, "like");
                handleLikeResult(await getResponseRemark(res));
            } else {
                const res = await remark("recents", data._id, "none");
                handleLikeResult(await getResponseRemark(res));
            }
        }
    }

    async function handleDislike(event: React.MouseEvent<HTMLElement>) {
        if (!user) {
            setAnchor(event.currentTarget);
        } else if (!dislike) {
            const res = await remark("recents", data._id, "dislike");
            handleDislikeResult(await getResponseRemark(res));
        } else {
            const res = await remark("recents", data._id, "none");
            handleDislikeResult(await getResponseRemark(res));
        }
    }

    React.useEffect(() => {
        cacheImage(imageUri).then(() => setCached(true));
    });

    return (
        <>
            <Card variant="outlined" sx={{borderRadius: 2}}>
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
                    <MarkdownScope>
                        {data.body}
                    </MarkdownScope>
                </CardContent>
                <CardActions disableSpacing className={styles.mWithoutTop}>
                    <Tooltip title="喜欢">
                        <span>
                        <IconButton aria-label="like" disabled={isUserLoading}
                                    onClick={handleLike}>
                            <LikeIcon color={like ? 'primary' : 'inherit'}/>
                        </IconButton>
                        </span>
                    </Tooltip>
                    <Tooltip title="不喜欢">
                        <span>
                        <IconButton aria-label="dislike" disabled={isUserLoading}
                                    onClick={handleDislike}>
                            <DislikeIcon color={dislike ? 'primary' : 'inherit'}/>
                        </IconButton>
                        </span>
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