import {useEffect, useState} from "react";

interface ScrollPos {
    top: number;
    left: number;
    height: number;
    width: number;
}

export default function useScroll(target?: Node) {
    const [scroll, setScroll] = useState<ScrollPos>({top: 0, left: 0, height: 0, width: 0});

    function scrollHandler(ev: Event) {
        const ele = (ev.target as HTMLElement);
        setScroll({
            top: ele.scrollTop,
            left: ele.scrollLeft,
            height: ele.scrollHeight,
            width: ele.offsetWidth
        })
    }


    useEffect(() => {
        let element: EventTarget | undefined = undefined;
        if (target) {
            element = target;
        } else if (typeof window !== 'undefined') {
            element = window;
        }
        element?.addEventListener('scroll', scrollHandler);

        return () => {
            element?.removeEventListener('scroll', scrollHandler)
        }
    }, [target])

    return scroll;
}
