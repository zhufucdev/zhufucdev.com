import {Stack} from "@mui/material";
import {ResponsiveStyleValue} from "@mui/system";
import {AnimatedActionFab} from "./AnimatedActionFab";
import React, {useEffect, useState} from "react";

type ScaffoldProps = {
    spacing: ResponsiveStyleValue<number | string>,
    fabContent?: React.ReactNode,
    hideFabOnScroll?: boolean,
    children: React.ReactNode,
    onFabClick?: React.MouseEventHandler<HTMLButtonElement>
};

export function Scaffold(props: ScaffoldProps): JSX.Element {
    const [showFab, setFab] = useState(true);

    useEffect(() => {
        if (props.hideFabOnScroll === false) return;
        let recentScroll = 0;

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

        const scrollHandler = (event: Event) => {
            if (event.currentTarget !== window) return;
            const current = window.scrollY;
            if (current > recentScroll) {
                // scrolling down
                setFab(false);
                timeout = timer();
            } else {
                setFab(true);
            }

            recentScroll = current;
        }
        window.addEventListener('scroll', scrollHandler);
        return () => {
            window.removeEventListener('scroll', scrollHandler);
        }
    }, [props.hideFabOnScroll]);

    return (
        <>
            <Stack spacing={props.spacing}>
                {props.children}
            </Stack>
            {props.fabContent &&
                <AnimatedActionFab show={showFab} onClick={props.onFabClick}>
                    {props.fabContent}
                </AnimatedActionFab>
            }
        </>
    )
}