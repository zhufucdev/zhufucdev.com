import {Inspiration} from "../lib/db/inspiration";
import {useProfile} from "../lib/useUser";
import * as React from "react";
import {useEffect, useMemo, useState} from "react";
import {useRequestResult} from "../lib/useRequestResult";
import {Card, CardActions, CardContent, Grid, IconButton, Tooltip, Typography} from "@mui/material";
import {LazyAvatar} from "./LazyAvatar";
import {green} from "@mui/material/colors";
import ImplementedIcon from "@mui/icons-material/DoneAllOutlined";
import FavoriteIcon from "@mui/icons-material/Favorite";
import DeleteIcon from "@mui/icons-material/DeleteOutline";
import LoginPopover from "./LoginPopover";
import {getResponseRemark, hasPermission, reCaptchaNotReady} from "../lib/contract";
import {fetchApi, remark} from "../lib/utility";
import {useGoogleReCaptcha} from "react-google-recaptcha-v3";

export interface RenderingInspiration extends Inspiration {
    raiserNick?: string | undefined
}

interface InspirationCardProps {
    data: RenderingInspiration,
    onDeleted: () => void,
    onImplementedChanged?: (implemented: boolean) => void
}

export function InspirationCardRoot({data, onDeleted, onImplementedChanged}: InspirationCardProps): JSX.Element {
    const {executeRecaptcha} = useGoogleReCaptcha();

    const {user, isLoading: isUserLoading} = useProfile();
    const canModify = useMemo(() => {
        if (!user) return false;
        return hasPermission(user, 'modify')
            || data.raiser === user._id && hasPermission(user, 'edit_own_post')
    }, [user]);
    const canModifyAll = useMemo(() => {
        if (!user) return false;
        return hasPermission(user, 'modify')
    }, [user]);

    const [anchor, setAnchor] = React.useState<HTMLElement | null>(null);
    const [liked, setLiked] = React.useState(false);
    const [likes, setLikes] = React.useState(data.likes.length);
    const [implemented, setImplemented] = React.useState(data.implemented);
    const handleLikeRes = useRequestResult(
        () => {
            if (!liked) {
                setLikes(likes + 1);
            } else {
                setLikes(likes - 1);
            }
            setLiked(!liked);
        }
    );
    const handleDelRes = useRequestResult(onDeleted);
    const handleImplRes = useRequestResult(
        () => {
            setImplemented(!implemented);
            onImplementedChanged?.call({}, !implemented);
        }
    );

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
            const mode = liked ? 'none' : 'like';
            const token = await executeRecaptcha();
            const res = await fetchApi('/api/remark/inspirations/' + mode + '/' + data._id, {token});
            handleLikeRes(await getResponseRemark(res));
        } else {
            handleLikeRes(reCaptchaNotReady);
        }
    }

    async function handleDelete() {
        if (executeRecaptcha) {
            const token = await executeRecaptcha();
            const res = await fetchApi(`/api/delete/inspirations/${data._id}`, {token});
            const remark = await getResponseRemark(res);
            handleDelRes(remark);
        } else {
            handleDelRes(reCaptchaNotReady);
        }
    }

    async function handleImplement() {
        if (executeRecaptcha) {
            const token = await executeRecaptcha();
            const res = await remark('inspirations', data._id, token, 'implement');
            const mark = await getResponseRemark(res);
            handleImplRes(mark);
        } else {
            handleImplRes(reCaptchaNotReady);
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
                    {canModify && (
                        <Tooltip title="删除">
                            <span>
                            <IconButton onClick={handleDelete}>
                                <DeleteIcon/>
                            </IconButton>
                            </span>
                        </Tooltip>
                    )}
                    {canModifyAll ? (
                        <Tooltip title={implemented ? "去实现" : "实现"}>
                            <span>
                            <IconButton onClick={handleImplement}>
                               <ImplementedIcon/>
                            </IconButton>
                            </span>
                        </Tooltip>
                    ) : (
                        implemented && (
                            <Tooltip title="已实现">
                                <ImplementedIcon aria-label="implemented"/>
                            </Tooltip>
                        )
                    )}
                    <Tooltip title="喜欢">
                        <span>
                        <IconButton onClick={handleLike} disabled={isUserLoading}>
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

export function InspirationCard({data, onDeleted}: InspirationCardProps): JSX.Element {
    const [implemented, setImplemented] = useState(data.implemented);
    const colorProps = implemented ? {backgroundColor: green[600]} : {};
    return (
        <Grid container>
            <Grid item mr={1} ml={1}>
                <LazyAvatar userId={data.raiser} link/>
            </Grid>

            <Grid item flexGrow={1} mt={1}>
                <Card sx={{...colorProps, borderRadius: 2}}>
                    <InspirationCardRoot data={data} onDeleted={onDeleted} onImplementedChanged={setImplemented}/>
                </Card>
            </Grid>
        </Grid>
    );
}