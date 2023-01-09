import * as React from "react";
import {cacheImage, getImageUri, lookupUser} from "../lib/utility";
import {Avatar, Skeleton, SxProps, Theme, useTheme} from "@mui/material";
import NoAccountsIcon from "@mui/icons-material/NoAccountsOutlined";

export function UserAvatar(props: { user?: UserID, image?: ImageID, size?: number, sx?: SxProps<Theme> }): JSX.Element {
    const {user, image, sx} = props;
    const theme = useTheme();
    const size = props.size ?? 56;

    const [loaded, setLoaded] = React.useState(false);
    const [imageUri, setImageUri] = React.useState('');

    React.useEffect(() => {
        if (imageUri) cacheImage(imageUri).then(() => setLoaded(true));
    }, [imageUri]);

    React.useEffect(() => {
        if (image) {
            setImageUri(getImageUri(image));
        } else if (user) {
            lookupUser(user)
                .then(v => {
                    const id = v?.avatar;
                    if (!id) throw 'avatar not found'
                    return id
                })
                .then(id => {
                    const uri = getImageUri(id);
                    setImageUri(uri);
                });
        } else {
            setLoaded(true);
        }
    }, [image, user])

    return loaded ? (
        imageUri ? (
            <Avatar
                src={imageUri}
                sx={{width: size, height: size, ...sx}}
                alt="头像"
            />
        ) : (
            <Avatar
                sx={{bgcolor: theme.palette.primary.main, width: size, height: size, ...sx}}
                alt="空头像"
            >
                <NoAccountsIcon sx={{color: theme.palette.primary.contrastText}}/>
            </Avatar>
        )
    ) : (
        <Skeleton
            variant="circular"
            animation="wave"
            width={size}
            height={size}
        />
    );
}