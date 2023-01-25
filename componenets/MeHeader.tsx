import {User, UserProfile} from "../lib/db/user";
import {
    Card,
    CardContent,
    CardHeader,
    Collapse,
    Fade,
    IconButton,
    LinearProgress,
    Skeleton,
    Stack,
    TextField,
    Tooltip,
    useMediaQuery,
    useTheme
} from "@mui/material";
import {UserAvatar} from "./UserAvatar";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import EditIcon from "@mui/icons-material/EditOutlined";
import DoneIcon from "@mui/icons-material/Done";
import {drawerWidth} from "../pages/_app";
import {LazyImage} from "./LazyImage";
import {fetchApi, getImageUri, uploadImage} from "../lib/utility";
import {useUser} from "../lib/useUser";
import React, {useEffect, useRef, useState} from "react";
import {getResponseRemark, userContract} from "../lib/contract";
import {useRequestResult} from "../lib/useRequestResult";
import {useGoogleReCaptcha} from "react-google-recaptcha-v3";
import {useSnackbar} from "notistack";

type HeaderProps = {
    user: User | undefined
}

const defaultBiograph = "你好世界";

export function MeHeader(props: HeaderProps) {
    const {user} = props;
    const {executeRecaptcha} = useGoogleReCaptcha();
    const theme = useTheme();
    const onLargeScreen = useMediaQuery(theme.breakpoints.up('sm'));
    const {user: current, mutateUser} = useUser();
    const [editMode, setEditMode] = useState(false);
    const [loading, setLoading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [nick, setNick] = useState(user?.nick);
    const [nickHelper, setNickHelper] = useState('');
    const [upload, setUpload] = useState('');
    const [bio, setBio] = useState(user?.biography);
    const [words, setWordCount] = useState(user?.biography?.length ?? 0);

    useEffect(() => {
        setNick(user?.nick);
        setBio(user?.biography);
        setWordCount(user?.biography?.length ?? 0);
    }, [props.user])

    const title =
        nick ? <Typography variant="h5">{nick}</Typography>
            : <Skeleton variant="text" animation="wave" sx={{fontSize: '2rem'}}/>;

    const subheader =
        user ? <Typography variant="body2" color="text.disabled">@{user._id}</Typography>
            : <Skeleton variant="text" animation="wave" sx={{fontSize: '2rem'}}/>;
    const action = user?._id === current &&
        <Tooltip title="编辑个人资料">
            <span>
            <IconButton onClick={() => setEditMode(true)} disabled={!user}>
                <EditIcon/>
            </IconButton>
            </span>
        </Tooltip>;
    const editorAction =
        <Tooltip title="完成">
            <span>
            <IconButton onClick={handleSubmit} disabled={loading}>
                <DoneIcon/>
            </IconButton>
            </span>
        </Tooltip>;

    const handleResult = useRequestResult(
        async () => {
            await mutateUser('');
            await mutateUser(current);
        },
        () => {
            // recover original data
            setNick(user?.nick);
            setBio(user?.biography);
            setUpload('');
        }
    );
    const {enqueueSnackbar} = useSnackbar();

    async function handleSubmit() {
        setLoading(true);

        let avatar: ImageID | undefined;
        try {
            avatar = await uploadAvatar();
        } catch (e) {
            postSubmit({
                success: false,
                msg: `头像上传失败: ${e}`
            });
            return;
        }
        let mod: UserProfile = {nick, biography: bio, avatar};
        if (nick === user?.nick) {
            delete mod.nick;
        }
        if (bio === user?.biography) {
            delete mod.biography;
        }
        if (!avatar || avatar === user?.avatar) {
            delete mod.avatar;
        }
        if (Object.getOwnPropertyNames(mod).length <= 0) {
            postSubmit({success: true})
            return;
        }

        const res = await fetchApi('/api/user', mod);
        const result = await getResponseRemark(res);
        postSubmit(result);
    }

    function postSubmit(result: RequestResult) {
        handleResult(result);
        setEditMode(false);
        setLoading(false)
    }

    const content =
        <CardContent>
            {
                user ?
                    <Typography variant="subtitle1">{bio ?? <i>{defaultBiograph}</i>}</Typography>
                    : <Skeleton variant="text" animation="wave"/>
            }
        </CardContent>;

    const editorTitle = (
        <Stack spacing={1} mr={1}>
            <TextField
                label="昵称"
                fullWidth
                value={nick}
                disabled={loading}
                onChange={handleNickChange}
                helperText={nickHelper}
                error={Boolean(nickHelper)}
            />
            <TextField
                label="简介"
                fullWidth
                value={bio}
                disabled={loading}
                onChange={handleBioChange}
                multiline
                helperText={`${words} / 50`}
                error={words > userContract.maxBioLen}
            />
        </Stack>
    )

    function handleNickChange(event: React.ChangeEvent<HTMLInputElement>) {
        setNick(event.currentTarget.value);
        if (userContract.testNick(event.currentTarget.value)) {
            setNickHelper('');
        } else {
            setNickHelper('昵称不可用')
        }
    }

    function handleBioChange(event: React.ChangeEvent<HTMLInputElement>) {
        const newBio = event.currentTarget.value;
        const count = newBio.trim().length
        setWordCount(count);
        if (count <= userContract.maxBioLen) {
            setBio(newBio);
        }
    }

    function handleAvatarClick() {
        if (!editMode || loading) return;
        fileInputRef.current?.click();
    }

    function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
        const file = event.currentTarget.files?.item(0);
        if (!file) return;

        const reader = new FileReader();
        reader.addEventListener('load', () => {
            setUpload(reader.result as string)
        })
        reader.addEventListener('error', () => {
            enqueueSnackbar('预览图片失败', {variant: 'error'})
        });
        reader.readAsDataURL(file);
    }

    async function uploadAvatar(): Promise<ImageID | undefined> {
        const file = fileInputRef.current?.files?.item(0);
        if (!file) return undefined;
        if (!executeRecaptcha) {
            throw new Error('reCaptcha not ready');
        }
        const token = await executeRecaptcha();
        const res = await uploadImage(file, token, 'avatar');
        if (res.ok) {
            return await res.text();
        } else {
            throw new Error(await res.text())
        }
    }

    return <>
        <Box sx={{
            position: 'absolute',
            top: 0,
            left: onLargeScreen ? drawerWidth : 0,
            right: 0,
            height: 250,
            zIndex: -1
        }}>
            <Box sx={{
                width: '100%',
                height: '100%',
                position: 'absolute',
                background: `linear-gradient(180deg, transparent 70%, ${theme.palette.background.default} 100%)`
            }}/>
            <LazyImage
                src={getImageUri(user?.cover ?? 'cover')}
                alt={`${user?._id}的封面`}
                style={{
                    width: '100%',
                    height: 250,
                    objectFit: 'cover'
                }}
            />
        </Box>
        <Card sx={{width: "90%", ml: 'auto', mr: 'auto', mt: 10, borderRadius: 4}}>
            <Fade in={loading} style={{transitionDelay: '400ms'}}>
                <LinearProgress variant="indeterminate"/>
            </Fade>
            <Box p={2}>
                <CardHeader
                    title={
                        <>
                            <Collapse in={!editMode} appear={false} unmountOnExit>
                                <Fade in={!editMode}>
                                    {title}
                                </Fade>
                            </Collapse>
                            <Collapse in={editMode} unmountOnExit>
                                <Fade in={editMode}>
                                    {editorTitle}
                                </Fade>
                            </Collapse>
                        </>
                    }
                    subheader={
                        <Collapse in={!editMode} appear={false} unmountOnExit>
                            <Fade in={!editMode}>
                                {subheader}
                            </Fade>
                        </Collapse>
                    }
                    avatar={upload ? <UserAvatar src={upload} onClick={handleAvatarClick}/> :
                        <UserAvatar user={user} onClick={handleAvatarClick}/>}
                    action={editMode ? editorAction : action}
                />
                {
                    (!editMode && user) && content
                }
            </Box>
        </Card>
        <input type="file" accept="image/*" hidden ref={fileInputRef} onChange={handleFileChange}/>
    </>
}