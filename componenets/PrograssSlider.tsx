import React from "react";
import {Box, CircularProgress, Fade, Slide, Zoom} from "@mui/material";
import CheckCircle from "@mui/icons-material/CheckCircle";
import Circle from "@mui/icons-material/Circle";
import Error from "@mui/icons-material/Error";

type ProgressSliderProps = {
    children: React.ReactNode,
    loading: boolean,
    done: boolean,
    error?: boolean
}

export function ProgressSlider(props: ProgressSliderProps): JSX.Element {
    const {children, loading, done, error} = props
    const finalStyle = {
        position: 'absolute',
        left: `calc(50% - 21px)`,
        top: `calc(50% - 24px)`,
        width: 42,
        height: 42,
        zIndex: 10
    };

    return (
        <>
            <Slide in={!loading && !done} direction="right" appear={false}>
                <Box>
                    {children}
                </Box>
            </Slide>
            <Slide in={loading || done || error} direction="left" unmountOnExit mountOnEnter>
                <Box sx={{position: 'absolute', top: 'calc(50% - 20px)', width: '100%', textAlign: 'center'}}>
                    <Fade in={!done && !error} appear={false}>
                        <Circle
                            sx={{
                                position: 'absolute',
                                left: 'calc(50% - 12px)',
                                top: 'calc(50% - 16px)',
                                width: 24,
                                height: 24,
                            }}/>
                    </Fade>
                    <Zoom in={done || error} appear={false}>
                        {done ?
                            <CheckCircle
                                sx={finalStyle}
                                color="success"/>
                            : <Error
                                sx={finalStyle}
                                color="error"/>
                        }
                    </Zoom>
                    <Fade in={!done && !error} appear={false}>
                        <CircularProgress/>
                    </Fade>
                </Box>
            </Slide>
        </>
    )
}