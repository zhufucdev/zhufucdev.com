import { Box, Dialog, SwipeableDrawer, useTheme } from "@mui/material";
import useMediaQuery from "@mui/material/useMediaQuery";
import { ReactNode } from "react";

export interface AdaptiveDialogProps {
    open: boolean;
    onClose: () => void;
    children: ReactNode;
}

export default function AdaptiveDialog(props: AdaptiveDialogProps) {
    const theme = useTheme();
    const fullscreen = useMediaQuery(theme.breakpoints.down("md"));
    if (fullscreen) {
        const grey = theme.palette.grey;
        const puller = (
            <Box
                sx={{
                    width: 30,
                    height: 6,
                    backgroundColor:
                        theme.palette.mode === "light" ? grey[300] : grey[900],
                    borderRadius: 3,
                    position: "absolute",
                    top: 8,
                    left: "calc(50% - 15px)",
                }}
            />
        );
        return (
            <SwipeableDrawer
                open={props.open}
                onClose={() => props.onClose()}
                onOpen={() => undefined}
                disableSwipeToOpen
                swipeAreaWidth={0}
                anchor="bottom"
                ModalProps={{ keepMounted: true }}
                PaperProps={{
                    sx: {
                        borderTopRightRadius: 8,
                        borderTopLeftRadius: 8,
                    },
                }}
                keepMounted={false}
            >
                {puller}
                <Box sx={{ marginTop: "10px" }}>{props.children}</Box>
            </SwipeableDrawer>
        );
    } else {
        return (
            <Dialog
                open={props.open}
                onClose={() => props.onClose()}
                keepMounted={false}
                PaperProps={{
                    sx: { minWidth: "400px" },
                }}
            >
                {props.children}
            </Dialog>
        );
    }
}
