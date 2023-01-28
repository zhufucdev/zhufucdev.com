import {Fab, useTheme, Zoom} from "@mui/material";
import * as React from "react";

type AnimatedActionFabProps = {
    show: boolean,
    onClick?: React.MouseEventHandler<HTMLButtonElement>,
    children: React.ReactNode
}

export function AnimatedActionFab(prop: AnimatedActionFabProps): JSX.Element {
    const theme = useTheme();
    const translations = {
        enter: theme.transitions.duration.enteringScreen,
        exit: theme.transitions.duration.leavingScreen
    }

    return (
        <Zoom in={prop.show} unmountOnExit timeout={translations} appear={false}>
            <Fab variant="extended"
                 sx={{position: 'fixed', right: 24, bottom: 24}}
                 color="primary"
                 onClick={prop.onClick}
            >
                {prop.children}
            </Fab>
        </Zoom>
    )
}