import CssBaseline from '@mui/material/CssBaseline'

import { useRouter } from 'next/router'
import * as React from 'react'
import { useEffect, useMemo, useState } from 'react'

import Box from '@mui/material/Box'
import Drawer from '@mui/material/Drawer'
import Toolbar from '@mui/material/Toolbar'
import Backdrop from '@mui/material/Backdrop'
import LinearProgress from '@mui/material/LinearProgress'

import { ThemeOptions, useMediaQuery } from '@mui/material'
import { createTheme, ThemeProvider } from '@mui/material/styles'
import { Analytics } from '@vercel/analytics/react'
import Head from 'next/head'
import createEmotionCache from '../lib/emotionCache'
import { CacheProvider } from '@emotion/react'
import { SnackbarProvider } from 'notistack'
import { SelfProfileProvider, useProfile } from '../lib/useUser'
import { getTitle, TitleProvider, useTitle } from '../lib/useTitle'
import { ContentsProvider } from '../lib/useContents'
import { LanguageProvider } from '../lib/useLanguage'
import { MyAppProps } from '../pages/_app'
import routes from '../lib/routes'
import dynamic from 'next/dynamic'
import LoadingScreen from './LoadingScreen'

export const drawerWidth = 240

const clientEmotionCache = createEmotionCache()
const MyDrawerContent = dynamic(() => import('./MyDrawerContent'), {
    loading: () => <LoadingScreen />,
    ssr: false
})
const MyAppBar = dynamic(() => import('./MyAppBar'), {
    loading: () => <LoadingScreen />,
})

function MyHead() {
    const [_title] = useTitle()
    const title = useMemo(() => getTitle(_title, true), [_title])
    return (
        <Head>
            <title>{title}</title>
        </Head>
    )
}

function MyBackdrop() {
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

export default function AppFrame({
    Component,
    pageProps,
    emotionCache = clientEmotionCache,
}: MyAppProps) {
    const router = useRouter()
    const [mobileOpen, setMobileOpen] = React.useState(false)
    const selfProfile = useProfile()

    const handleDrawerToggle = () => {
        setMobileOpen(!mobileOpen)
    }

    const prefersDark = useMediaQuery('(prefers-color-scheme: dark)')
    const theme = React.useMemo(
        () => createTheme(getDesignTokens(prefersDark)),
        [prefersDark]
    )

    return (
        <CacheProvider value={emotionCache}>
            <ThemeProvider theme={theme}>
                <TitleProvider
                    title={
                        routes.find((e) => e.route === router.pathname)?.title
                    }
                >
                    <ContentsProvider>
                        <MyHead />
                        <MyBackdrop />
                        <SnackbarProvider>
                            <SelfProfileProvider {...selfProfile}>
                                <LanguageProvider>
                                    <Box sx={{ display: 'flex' }}>
                                        <CssBaseline />
                                        <MyAppBar
                                            onToggleDrawer={handleDrawerToggle}
                                        />

                                        <Box
                                            component="nav"
                                            sx={{
                                                width: { sm: drawerWidth },
                                                flexShrink: { sm: 0 },
                                            }}
                                            aria-label="drawer content"
                                        >
                                            <Drawer
                                                variant="temporary"
                                                open={mobileOpen}
                                                onClose={handleDrawerToggle}
                                                ModalProps={{
                                                    keepMounted: true, // Better open performance on mobile.
                                                }}
                                                sx={{
                                                    display: {
                                                        xs: 'block',
                                                        sm: 'none',
                                                    },
                                                    '& .MuiDrawer-paper': {
                                                        boxSizing: 'border-box',
                                                        width: drawerWidth,
                                                    },
                                                }}
                                            >
                                                <MyDrawerContent
                                                    onItemClicked={
                                                        handleDrawerToggle
                                                    }
                                                />
                                            </Drawer>
                                            <Drawer
                                                variant="permanent"
                                                sx={{
                                                    display: {
                                                        xs: 'none',
                                                        sm: 'block',
                                                    },
                                                    '& .MuiDrawer-paper': {
                                                        boxSizing: 'border-box',
                                                        width: drawerWidth,
                                                    },
                                                }}
                                                open
                                            >
                                                <MyDrawerContent
                                                    onItemClicked={
                                                        handleDrawerToggle
                                                    }
                                                />
                                            </Drawer>
                                        </Box>

                                        <Box
                                            sx={{
                                                flexGrow: 1,
                                                p: 3,
                                                width: {
                                                    sm: `calc(100% - ${drawerWidth}px)`,
                                                },
                                            }}
                                        >
                                            <Toolbar />
                                            <Component {...pageProps} />
                                        </Box>
                                    </Box>
                                    <Analytics />
                                </LanguageProvider>
                            </SelfProfileProvider>
                        </SnackbarProvider>
                    </ContentsProvider>
                </TitleProvider>
            </ThemeProvider>
        </CacheProvider>
    )
}

function getDesignTokens(dark: boolean): ThemeOptions {
    return dark
        ? {
              palette: {
                  mode: 'dark',
                  primary: {
                      main: '#EF6C00',
                  },
                  secondary: {
                      main: '#00BCD4',
                  },
              },
          }
        : {
              palette: {
                  mode: 'light',
                  primary: {
                      main: '#E65100',
                  },
                  secondary: {
                      main: '#00ACC1',
                  },
              },
          }
}
