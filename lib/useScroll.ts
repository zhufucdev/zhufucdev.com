import { useEffect, useState } from 'react'

interface ScrollPos {
    top: number
    left: number
    height: number
    width: number
}

/**
 * A event hool for scroll
 * @param target defaults to Window
 * @returns a bounding box of the target element, or NaN if unknown
 */
export default function useScroll(target?: HTMLElement) {
    const [scroll, setScroll] = useState<ScrollPos>({
        top: NaN,
        left: NaN,
        height: NaN,
        width: NaN,
    })

    useEffect(() => {
        let scrollTarget: Window | undefined = undefined
        let scrollerHandler: (() => void) | undefined
        if (typeof window !== 'undefined') {
            scrollTarget = window
            scrollerHandler = () => {
                if (target) {
                    const bounds = target.getBoundingClientRect()
                    setScroll({
                        top: bounds.top,
                        left: bounds.left,
                        height: bounds.height,
                        width: bounds.width
                    })
                } else {
                    setScroll({
                        top: window.scrollY,
                        left: window.scrollX,
                        height: document.body.scrollHeight,
                        width: document.body.scrollWidth,
                    })
                }
            }
        }

        if (scrollerHandler) {
            scrollerHandler()
            scrollTarget?.addEventListener('scroll', scrollerHandler)

            return () => {
                scrollTarget?.removeEventListener('scroll', scrollerHandler!)
            }
        }
    }, [target])

    return scroll
}
