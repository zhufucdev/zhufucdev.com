import {EventHandler, useEffect, useState} from "react";

interface ScrollPos {
    top: number;
    left: number;
    height: number;
    width: number;
}

export default function useScroll(target?: HTMLElement) {
    const [scroll, setScroll] = useState<ScrollPos>({top: 0, left: 0, height: 0, width: 0});

    useEffect(() => {
        let element: Element | Window | undefined = undefined;
        let scrollerHandler: (() => void) | undefined;
        if (target) {
            element = target;
            scrollerHandler = () => {
                setScroll({
                    top: target.scrollTop,
                    left: target.scrollLeft,
                    height: target.scrollHeight,
                    width: target.scrollWidth
                })
            }
        } else if (typeof window !== 'undefined') {
            element = window;
            scrollerHandler = () => {
                setScroll({
                    top: window.scrollY,
                    left: window.scrollX,
                    height: document.body.scrollHeight,
                    width: document.body.scrollWidth
                })
            }
        }

        if (scrollerHandler) {
            scrollerHandler();
            element?.addEventListener('scroll', scrollerHandler);

            return () => {
                element?.removeEventListener('scroll', scrollerHandler!)
            }
        }
    }, [target])

    return scroll;
}
