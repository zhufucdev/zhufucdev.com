import * as React from "react";
import {cacheImage, getImageUri} from "../lib/utility";
import {Avatar, Skeleton, SxProps, Theme, useTheme} from "@mui/material";
import NoAccountsIcon from "@mui/icons-material/NoAccountsOutlined";
import AccountIcon from "@mui/icons-material/AccountCircleOutlined";
import {lookupUser} from "../lib/useUser";
import {User} from "../lib/db/user";

type UserAvatarProps = { userId?: UserID, user?: User, image?: ImageID, size?: number, sx?: SxProps<Theme> };

export function UserAvatar(props: UserAvatarProps): JSX.Element {
    const theme = useTheme();
    const {userId, user, image, sx} = props;
    const size = props.size ?? 56;

    const [loaded, setLoaded] = React.useState(false);
    const [imageUri, setImageUri] = React.useState('');

    React.useEffect(() => {
        if (imageUri) cacheImage(imageUri).then(() => setLoaded(true));
    }, [imageUri]);

    React.useEffect(() => {
        if (image) {
            setImageUri(getImageUri(image));
        } else if (userId) {
            lookupUser(userId)
                .then(v => {
                    const id = v?.avatar;
                    if (!id) throw new Error()
                    return id
                })
                .then(
                    (id) => {
                        const uri = getImageUri(id);
                        setImageUri(uri);
                    },
                    () => {
                        setLoaded(true);
                    }
                );
        } else if (user && user.avatar) {
            setImageUri(getImageUri(user.avatar));
        } else {
            setImageUri('');
            setLoaded(true);
        }
    }, [image, userId, user])

    const iconStyle: SxProps<Theme> = {
        color: theme.palette.primary.contrastText,
        width: size * 0.618, height: size * 0.618
    }

    return loaded ? (
        imageUri ? (
            <Avatar
                src={imageUri}
                sx={{width: size, height: size, ...sx}}
                alt="头像"
                key="real"
            />
        ) : (
            <Avatar
                sx={{bgcolor: theme.palette.primary.main, width: size, height: size, ...sx}}
                alt="空头像"
                key="empty"
            >
                {userId || user ?
                    <AccountIcon key="empty" sx={iconStyle}/>
                    : <NoAccountsIcon key="disabled" sx={iconStyle}/>}
            </Avatar>
        )
    ) : (
        <Skeleton
            variant="circular"
            animation="wave"
            key="skeleton"
            width={size}
            height={size}
        />
    );
}