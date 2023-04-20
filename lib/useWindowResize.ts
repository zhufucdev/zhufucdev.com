import {useEffect, useState} from "react";

export function useWindowResize(): number[] {
    const [size, setSize] = useState([0, 0]);
    useEffect(() => {
        if (typeof window === 'undefined') return;

        window.addEventListener('resize', () => {
            setSize([window.innerWidth, window.innerHeight]);
        })
    }, []);

    return size
}