import { useRouter } from 'next/router'
import * as React from 'react'
import { useEffect, useState } from 'react'
import Backdrop from '@mui/material/Backdrop'
import LinearProgress from '@mui/material/LinearProgress'

export default function MyBackdrop() {
    const router = useRouter()
    const [transiting, setTransiting] = useState(false)
    const [progress, setProgress] = useState(-1)
    useEffect(() => {
        let timer: NodeJS.Timer

        function onHandler() {
            setTransiting(true)
            setProgress(0)
            let i = 1
            timer = setInterval(() => {
                if (transiting) clearInterval(timer)
                else {
                    setProgress(100 - 100 / i)
                    i++
                }
            }, 100)
        }

        function offHandler() {
            setTransiting(false)
            setProgress(100)
        }

        router.events.on('routeChangeStart', onHandler)
        router.events.on('routeChangeComplete', offHandler)
        router.events.on('routeChangeError', offHandler)

        return () => {
            router.events.off('routeChangeStart', onHandler)
            router.events.off('routeChangeComplete', offHandler)
            router.events.off('routeChangeError', offHandler)
        }
    }, [router])

    return (
        <Backdrop
            open={transiting}
            unmountOnExit
            sx={{ zIndex: 10000, transitionDelay: '400ms' }}
        >
            <LinearProgress
                variant="determinate"
                value={progress}
                sx={{ position: 'absolute', top: 0, width: '100%' }}
            />
        </Backdrop>
    )
}
