import {Inspiration} from "../lib/db/inspiration";
import {useProfileContext} from "../lib/useUser";
import * as React from "react";
import {useEffect, useMemo, useState} from "react";
import {useRequestResult} from "../lib/useRequestResult";
import {
    Card,
    CardActions,
    CardContent, CircularProgress,
    Grid,
    IconButton,
    Menu, MenuItem,
    MenuList,
    MenuProps, Skeleton,
    Tooltip,
    Typography
} from "@mui/material";
import {LazyAvatar} from "./LazyAvatar";
import {green, yellow} from "@mui/material/colors";
import ImplementedIcon from "@mui/icons-material/DoneAllOutlined";
import NotPlannedIcon from "@mui/icons-material/RemoveDoneOutlined";
import FavoriteIcon from "@mui/icons-material/Favorite";
import DeleteIcon from "@mui/icons-material/DeleteOutline";
import MoreIcon from "@mui/icons-material/MoreVert";
import ArchiveIcon from "@mui/icons-material/ArchiveOutlined";
import UnarchiveIcon from "@mui/icons-material/UnarchiveOutlined";
import LoginPopover from "./LoginPopover";
import {getResponseRemark, hasPermission, reCaptchaNotReady} from "../lib/contract";
import {fetchApi} from "../lib/utility";
import {useGoogleReCaptcha} from "react-google-recaptcha-v3";
import {DeleteAlertDialog} from "./DeleteAlertDialog";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import {User} from "../lib/db/user";

export interface RenderingInspiration extends Inspiration {
    raiserNick?: string | undefined
}

interface InspirationCardProps {
    data: RenderingInspiration;
    onDeleted: () => void;
    onFlagChanged?: (flag: InspirationFlag) => void;
    onArchiveChanged?: (archived: boolean) => void;
}

export function InspirationCardRoot(props: InspirationCardProps & { fullWidth?: boolean }): JSX.Element {
    const {executeRecaptcha} = useGoogleReCaptcha();
    const {data} = props;

    const {user, isLoading: isUserLoading} = useProfileContext();
    const canModify = useMemo(() => {
        if (!user) return false;
        return hasPermission(user, 'modify')
            || data.raiser === user._id && hasPermission(user, 'edit_own_post')
    }, [user]);

    const [anchor, setAnchor] = React.useState<HTMLElement | null>(null);
    const [menuAnchor, setMenuAnchor] = React.useState<HTMLElement | null>(null);
    const [liked, setLiked] = React.useState(false);
    const [likes, setLikes] = React.useState(data.likes.length);

    const [flag, setFlag] = React.useState(data.flag);
    const [archived, setArchived] = React.useState(data.archived);
    useEffect(() => {
        setFlag(data.flag)
    }, [data.flag]);
    useEffect(() => {
        setArchived(data.archived)
    }, [data.archived]);

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

    function getMarker() {
        switch (flag) {
            case "implemented":
                return <Tooltip title="已实现">
                    <ImplementedIcon/>
                </Tooltip>
            case "none":
                return undefined
            case "not_planned":
                return <Tooltip title="不设计划">
                    <NotPlannedIcon/>
                </Tooltip>
            case "sus":
                return "🤔"
        }
    }

    return <>
        <CardContent sx={{paddingBottom: 0, overflowWrap: 'anywhere'}}>{data.body}</CardContent>
        <CardActions>
            <Grid container ml={1}>
                <Grid item flexGrow={props.fullWidth === false ? 0 : 1} mr={props.fullWidth === false ? 3 : 0}>
                    <Typography variant="body2" color="text.secondary">
                        {data.raiserNick ? data.raiserNick : data.raiser}
                    </Typography>
                </Grid>
                <Grid item
                      alignItems="center"
                      display="flex">
                    {getMarker()}
                    {archived && (
                        <Tooltip title="已归档">
                            <ArchiveIcon/>
                        </Tooltip>
                    )}
                    {isUserLoading
                        ? <Skeleton variant="rectangular" width={120} height={24}/>
                        : (<>
                            <Tooltip title="喜欢">
                            <span>
                                <IconButton onClick={handleLike}>
                                    <FavoriteIcon color={liked ? 'error' : 'inherit'}/>
                                </IconButton>
                            </span>
                            </Tooltip>
                            <Typography variant="caption" style={{marginRight: canModify ? 0 : 12}}>
                                {likes}
                            </Typography>
                            {canModify && (
                                <Tooltip title="更多">
                            <span>
                            <IconButton onClick={ev => setMenuAnchor(ev.currentTarget)}>
                                <MoreIcon/>
                            </IconButton>
                            </span>
                                </Tooltip>
                            )}
                        </>)
                    }
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

        <ContextMenu
            open={Boolean(menuAnchor)}
            anchorEl={menuAnchor}
            transformOrigin={{
                horizontal: 'right',
                vertical: 'top'
            }}
            anchorOrigin={{
                horizontal: 'right',
                vertical: 'bottom'
            }}
            onClose={() => setMenuAnchor(null)}
            user={user}
            flag={flag}
            archived={archived}
            {...props}
            onFlagChanged={(flag) => {
                props.onFlagChanged?.call({}, flag);
                setFlag(flag);
            }}
            onArchiveChanged={(archived) => {
                props.onArchiveChanged?.call({}, archived);
                setArchived(archived);
            }}
        />
    </>
}

export function InspirationCard({data, onDeleted, onArchiveChanged}: InspirationCardProps): JSX.Element {
    const [flag, setFlag] = useState(data.flag);
    const colorProps = {backgroundColor: recommendedColorFor(flag)};
    return (
        <Grid container>
            <Grid item mr={1} ml={1}>
                <LazyAvatar userId={data.raiser} link/>
            </Grid>

            <Grid item flexGrow={1} mt={1}>
                <Card sx={{...colorProps, borderRadius: 2}}>
                    <InspirationCardRoot
                        data={data}
                        onDeleted={onDeleted}
                        onFlagChanged={setFlag}
                        onArchiveChanged={onArchiveChanged}
                    />
                </Card>
            </Grid>
        </Grid>
    );
}

export function recommendedColorFor(flag: InspirationFlag): string {
    switch (flag) {
        case "not_planned":
            return yellow[800]
        case "implemented":
            return green[600];
        case "sus":
        case "none":
            return "inherit"
    }
}

function ContextMenu(props: MenuProps & InspirationCardProps & { user: User | undefined, flag: InspirationFlag, archived: boolean }) {
    const {executeRecaptcha} = useGoogleReCaptcha();
    const [toDelete, setToDelete] = useState(false);
    const [processing, setProcessing] = useState('');

    const canModifyAll = useMemo(() => {
        if (!props.user) return false;
        return hasPermission(props.user, 'modify')
    }, [props.user]);

    const handleDelRes = useRequestResult(props.onDeleted);
    const handleFlagRes = useRequestResult();
    const handleArchiveRes = useRequestResult(() => {
        props.onArchiveChanged?.call({}, !props.archived);
    });

    async function handleDelete() {
        if (processing === 'delete') return;

        setProcessing('delete');
        if (executeRecaptcha) {
            const token = await executeRecaptcha();
            const res = await fetchApi(`/api/delete/inspirations/${props.data._id}`, {token});
            const remark = await getResponseRemark(res);
            handleDelRes(remark);
        } else {
            handleDelRes(reCaptchaNotReady);
        }
        setProcessing('');
    }

    async function handleFlag(flag: InspirationFlag) {
        if (processing === flag) return;

        setProcessing(flag);
        if (executeRecaptcha) {
            const token = await executeRecaptcha();
            const newFlag = props.flag === flag ? 'none' : flag;
            const res = await fetchApi(
                `/api/inspiration/${props.data._id}/${newFlag}`,
                {token}
            );
            const mark = await getResponseRemark(res);
            handleFlagRes(mark);

            if (mark.success) {
                props.onFlagChanged?.call({}, newFlag);
            }
        } else {
            handleFlagRes(reCaptchaNotReady);
        }
        props.onClose?.call({}, {}, 'backdropClick');
        setProcessing('')
    }

    async function handleArchive() {
        if (processing === 'archive') return;

        setProcessing('archive');
        if (executeRecaptcha) {
            const token = await executeRecaptcha();
            const res = await fetchApi(
                `/api/inspiration/${props.data._id}/${props.archived ? 'unarchive' : 'archive'}`,
                {token}
            );
            const remark = await getResponseRemark(res);
            handleArchiveRes(remark);
        } else {
            handleArchiveRes(reCaptchaNotReady);
        }
        setProcessing('')
    }

    return <>
        <Menu {...props}>
            <MenuList disablePadding>
                <MenuItem onClick={() => setToDelete(true)}>
                    <ListItemIcon>
                        {processing === 'delete' ? <Processing/> : <DeleteIcon/>}
                    </ListItemIcon>
                    <ListItemText>删除</ListItemText>
                </MenuItem>
                <MenuItem onClick={handleArchive}>
                    <ListItemIcon>
                        {processing === 'archive' ? <Processing/> : (props.archived ? <UnarchiveIcon/> :
                            <ArchiveIcon/>)}
                    </ListItemIcon>
                    <ListItemText>
                        {props.archived ? '取消归档' : '归档'}
                    </ListItemText>
                </MenuItem>
                {canModifyAll && <>
                    <MenuItem onClick={() => handleFlag('implemented')}>
                        <ListItemIcon>
                            {processing === 'implemented' ? <Processing/> : <ImplementedIcon/>}
                        </ListItemIcon>
                        <ListItemText>实现</ListItemText>
                    </MenuItem>
                    <MenuItem onClick={() => handleFlag('not_planned')}>
                        <ListItemIcon>
                            {processing === 'not_planned' ? <Processing/> : <NotPlannedIcon/>}
                        </ListItemIcon>
                        <ListItemText>不设计划</ListItemText>
                    </MenuItem>
                    <MenuItem onClick={() => handleFlag('sus')}>
                        <ListItemIcon>
                            {processing === 'sus' ? <Processing/> : '🤔'}
                        </ListItemIcon>
                        <ListItemText>这啥呀</ListItemText>
                    </MenuItem>
                </>}
            </MenuList>
        </Menu>

        <DeleteAlertDialog
            targetName="灵感"
            open={toDelete}
            onConfirm={handleDelete}
            onClose={() => setToDelete(false)}
        />
    </>
}

function Processing() {
    return <CircularProgress size="24px"/>
}