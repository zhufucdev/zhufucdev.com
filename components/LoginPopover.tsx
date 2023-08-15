import {
    Button,
    Grid,
    Popover,
    PopoverProps,
    Typography,
    Box,
} from "@mui/material";

import Link from "next/link";
import {useRouter} from "next/router";

interface Props extends PopoverProps {
    callback?: string
}

export default function LoginPopover(props: Props) {
    const router = useRouter();

    function handleLoginRequest() {
        localStorage.setItem('login_from', props.callback ?? router.asPath);
    }

    return (
        <Popover {...props}>
            <Box sx={{p: 2}}>
                <Typography variant="h6">登录以继续</Typography>
                <Grid container flexDirection="row-reverse" mt={1}>
                    <Grid item>
                        <Button
                            variant="outlined"
                            component={Link}
                            href="/login"
                            onClick={handleLoginRequest}
                        >
                            登录
                        </Button>
                    </Grid>
                </Grid>
            </Box>
        </Popover>
    );
}
