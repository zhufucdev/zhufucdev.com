import {Typography} from "@mui/material";

export function Copyright() {
    return (
        <Typography variant="body1" color="text.disabled" sx={{textAlign: 'center', marginTop: 2}}>
            Copyright zhufucdev {new Date().getFullYear()}
        </Typography>
    )
}