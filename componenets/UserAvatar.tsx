import * as React from "react";
import {cacheImage, getImageUri} from "../lib/utility";
import {Avatar, Skeleton, SxProps, Theme, useTheme} from "@mui/material";
import NoAccountsIcon from "@mui/icons-material/NoAccountsOutlined";
import AccountIcon from "@mui/icons-material/AccountCircleOutlined";
import {lookupUser} from "../lib/useUser";
import {User} from "../lib/db/user";
import {useMemo} from "react";

type UserAvatarProps = {
    image?: ImageID,
    size?: number,
    sx?: SxProps<Theme>,
    onClick?: React.MouseEventHandler<HTMLElement>,
    user?: User,
    userId?: UserID,
    loading?: boolean
};

export function UserAvatar(props: UserAvatarProps): JSX.Element {
    const theme = useTheme();
    const {userId, user, image, sx, onClick, loading} = props;
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
        } else if (!loading) {
            setImageUri('');
            setLoaded(true);
        }
    }, [image, userId, user, loading])

    const iconStyle: SxProps<Theme> = useMemo(() => ({
        color: theme.palette.primary.contrastText,
        width: size * 0.618, height: size * 0.618
    }), [theme, size]);

    return loaded ? (
        imageUri ? (
            <Avatar
                src={imageUri}
                sx={{width: size, height: size, ...sx}}
                alt="头像"
                key="real"
                onClick={onClick}
            />
        ) : (
            <Avatar
                sx={{bgcolor: theme.palette.primary.main, width: size, height: size, ...sx}}
                alt="空头像"
                key="empty"
                onClick={onClick}
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
            onClick={onClick}
        />
    );
}