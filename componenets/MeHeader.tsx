import {User} from "../lib/db/user";
import {Card, CardContent, CardHeader, Skeleton, useMediaQuery, useTheme} from "@mui/material";
import {UserAvatar} from "./UserAvatar";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import {drawerWidth} from "../pages/_app";
import {LazyImage} from "./LazyImage";
import {getImageUri} from "../lib/utility";

type HeaderProps = {
    user: User | undefined
}

const defaultBiograph = "你好世界";

export function MeHeader(props: HeaderProps) {
    const {user} = props;
    const theme = useTheme();
    const onLargeScreen = useMediaQuery(theme.breakpoints.up('sm'));
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
        <Card sx={{width: "90%", ml: 'auto', mr: 'auto', mt: 10, p: 2, borderRadius: 4}}>
            <CardHeader
                avatar={<UserAvatar user={user} loading={Boolean(!user)} sx={{ml: 1}}/>}
                title={
                    user ? <Typography variant="h5">{user.nick}</Typography>
                        : <Skeleton variant="text" animation="wave" sx={{fontSize: '2rem'}}/>
                }
                subheader={
                    user ? <Typography variant="body2" color="text.disabled">@{user._id}</Typography>
                        : <Skeleton variant="text" animation="wave" sx={{fontSize: '2rem'}}/>
                }
            />
            <CardContent>
                {
                    user ?
                        <Typography variant="subtitle1">{user?.biography ?? <i>{defaultBiograph}</i>}</Typography>
                        : <Skeleton variant="text" animation="wave"/>
                }
            </CardContent>
        </Card>
    </>
}