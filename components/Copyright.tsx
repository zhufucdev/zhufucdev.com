import {Typography} from "@mui/material";

type CopyrightProps = {
    marginTop?: number
}

export function Copyright(props: CopyrightProps) {
    return (
        <Typography variant="body2" color="text.disabled" sx={{textAlign: 'center', marginTop: props.marginTop ?? 2}}>
            Copyright zhufucdev {new Date().getFullYear()}
        </Typography>
    )
}