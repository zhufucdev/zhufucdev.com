import {Stack} from "@mui/material";
import {ResponsiveStyleValue} from "@mui/system";
import {AnimatedActionFab} from "./AnimatedActionFab";
import React, {useEffect, useState} from "react";

type ScaffoldProps = {
    spacing: ResponsiveStyleValue<number | string>,
    fab: React.ReactNode,
    hideFabOnScroll?: boolean,
    children: React.ReactNode,
    onFabClick?: React.MouseEventHandler<HTMLButtonElement>
};

export function Scaffold(props: ScaffoldProps): JSX.Element {
    const [showFab, setFab] = useState(true);
    const [recentScroll, setRecentScroll] = useState(0);

    useEffect(() => {
        if (props.hideFabOnScroll === false) return;

        let timeout: NodeJS.Timeout;
        function timer(): NodeJS.Timeout {
            let captured: NodeJS.Timeout;
            captured = setTimeout(() => {
                if (timeout !== captured) {
                    return;
                }
                setFab(true);
            }, 5000)
            return captured;
        }
        const scrollHandler = () => {
            const current = window.scrollY;
            if (current > recentScroll) {
                // scrolling down
                setFab(false);
                timeout = timer();
            } else {
                setFab(true);
            }

            setRecentScroll(current);
        }
        window.removeEventListener('scroll', scrollHandler);
        window.addEventListener('scroll', scrollHandler);
    }, [props.hideFabOnScroll]);

    return (
        <>
            <Stack spacing={props.spacing}>
                {props.children}
            </Stack>
            <AnimatedActionFab show={showFab} onClick={props.onFabClick}>
                {props.fab}
            </AnimatedActionFab>
        </>
    )
}