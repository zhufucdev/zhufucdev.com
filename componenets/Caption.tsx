import {Typography, TypographyProps, useTheme} from "@mui/material";
import * as React from "react";

export function Caption(props: TypographyProps) {
    const theme = useTheme()
    return (
        <Typography mb={props.noWrap ? 0 : 1} variant="subtitle2" color={theme.palette.primary.main} {...props}>
            {props.children}
        </Typography>
    );
}