import Fab from "@mui/material/Fab";
import Zoom from "@mui/material/Zoom"
import * as React from "react";
import { useTheme } from "@mui/material";

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