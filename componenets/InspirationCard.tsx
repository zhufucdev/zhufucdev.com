import {Inspiration} from "../lib/db/inspiration";
import {useUser} from "../lib/useUser";
import * as React from "react";
import {useEffect} from "react";
import {useRequestResult} from "../lib/useRequestResult";
import {Card, CardActions, CardContent, Grid, IconButton, Tooltip, Typography} from "@mui/material";
import {LazyAvatar} from "./LazyAvatar";
import {green} from "@mui/material/colors";
import ImplementedIcon from "@mui/icons-material/DoneAllOutlined";
import FavoriteIcon from "@mui/icons-material/Favorite";
import LoginPopover from "./LoginPopover";
import {getResponseRemark} from "../lib/contract";

export interface RenderingInspiration extends Inspiration {
    raiserNick?: string | undefined
}

export function InspirationCardRoot(props: {data: RenderingInspiration}): JSX.Element {
    const {data} = props;
    const {user, isLoading: isUserLoading} = useUser();

    const [anchor, setAnchor] = React.useState<HTMLElement | null>(null);
    const [liked, setLiked] = React.useState(false);
    const [likes, setLikes] = React.useState(data.likes.length);
    const handleResponse = useRequestResult(
        () => {
            if (!liked) {
                setLikes(likes + 1);
            } else {
                setLikes(likes - 1);
            }
            setLiked(!liked);
        }
    )

    useEffect(() => {
        if (!user) {
            setLiked(false);
        } else {
            setLiked(data.likes.includes(user));
        }
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
            handleResponse(await getResponseRemark(res));
        }
    }

    return <>
        <CardContent sx={{paddingBottom: 0, overflowWrap: 'anywhere'}}>{data.body}</CardContent>
        <CardActions>
            <Grid container ml={1}>
                <Grid item flexGrow={1}>
                    <Typography variant="body2" color="text.secondary">
                        {data.raiserNick ? data.raiserNick : data.raiser}
                    </Typography>
                </Grid>
                <Grid item alignItems="center" sx={{display: "flex"}}>
                    {data.implemented ? (
                        <Tooltip title="已实现">
                            <ImplementedIcon aria-label="implemented"/>
                        </Tooltip>
                    ) : null}
                    <Tooltip title="喜欢">
                                        <span>
                                        <IconButton aria-label="like" onClick={handleLike} disabled={isUserLoading}>
                                            <FavoriteIcon color={liked ? 'error' : 'inherit'}/>
                                        </IconButton>
                                        </span>
                    </Tooltip>
                    <Typography variant="caption" style={{marginRight: 12}}>
                        {likes}
                    </Typography>
                </Grid>
            </Grid>
        </CardActions>

        <LoginPopover
            open={anchor != null}
            anchorEl={anchor}
            onClose={handlePopoverClose}
            anchorOrigin={{vertical: "bottom", horizontal: "right"}}
            transformOrigin={{vertical: "top", horizontal: "right"}}
        />
    </>
}

export function InspirationCard(props: { data: RenderingInspiration }): JSX.Element {
    const {data} = props;
    const colorProps = data.implemented ? {backgroundColor: green[600]} : {};
    return (
        <>
            <Grid container>
                <Grid item mr={1} ml={1}>
                    <LazyAvatar userId={data.raiser} link/>
                </Grid>

                <Grid item flexGrow={1} mt={1}>
                    <Card sx={{...colorProps, borderRadius: 2}}>
                        <InspirationCardRoot data={data}/>
                    </Card>
                </Grid>
            </Grid>
        </>
    );
}