import "../styles/globals.sass";
import type {AppProps} from "next/app";

import {useRouter} from "next/router";
import * as React from "react";

import Box from "@mui/material/Box";
import Drawer from "@mui/material/Drawer";
import CssBaseline from "@mui/material/CssBaseline";
import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import List from "@mui/material/List";
import Typography from "@mui/material/Typography";
import Divider from "@mui/material/Divider";
import ListItem from "@mui/material/ListItem";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import {IconButton, ThemeOptions, useMediaQuery} from "@mui/material";

import {createTheme, ThemeProvider} from "@mui/material/styles";

import HomeIcon from "@mui/icons-material/Home";
import MenuIcon from "@mui/icons-material/Menu";
import Head from "next/head";
import createEmotionCache from "../lib/emotionCache";
import {CacheProvider, EmotionCache} from "@emotion/react";
import Link from "next/link";
import {SnackbarProvider} from "notistack";
import {Analytics} from "@mui/icons-material";

const drawerWidth = 240;

const clientEmotionCache = createEmotionCache();

interface MyAppProps extends AppProps {
    emotionCache?: EmotionCache,
    pageProps: { window: () => Window, recaptchaKey: string }
}

function MyApp({Component, pageProps, emotionCache = clientEmotionCache}: MyAppProps) {
    const router = useRouter();
    const {window} = pageProps;
    const [mobileOpen, setMobileOpen] = React.useState(false);

    const handleDrawerToggle = () => {
        setMobileOpen(!mobileOpen);
    };

    const drawerContent = (
        <>
            <Toolbar/>
            <Divider/>
            <List>
                {drawerRoutes
                    .filter((e) => !e.hidden)
                    .map((entry) => (
                        <ListItem key={entry.name} disablePadding>
                            <ListItemButton
                                onClick={handleDrawerToggle}
                                component={Link}
                                href={entry.path}
                                selected={router.pathname === entry.path}
                            >
                                <ListItemIcon>{entry.icon}</ListItemIcon>
                                <ListItemText primary={entry.title}/>
                            </ListItemButton>
                        </ListItem>
                    ))}
            </List>
        </>
    );
    const container =
        window !== undefined ? () => window().document.body : undefined;

    const prefersDark = useMediaQuery("(prefers-color-scheme: dark)");
    const theme = React.useMemo(
        () => createTheme(getDesignTokens(prefersDark)),
        [prefersDark]
    );

    return (
        <CacheProvider value={emotionCache}>
            <Head>
                <title>zhufucdev</title>
            </Head>
            <ThemeProvider theme={theme}>
                <SnackbarProvider>
                    <Box sx={{display: "flex"}}>
                        <CssBaseline/>
                        <AppBar
                            position="fixed"
                            sx={{
                                width: {sm: `calc(100% - ${drawerWidth}px)`},
                                ml: `${drawerWidth}px`,
                            }}
                        >
                            <Toolbar>
                                <IconButton
                                    color="inherit"
                                    aria-label="open drawer"
                                    edge="start"
                                    onClick={handleDrawerToggle}
                                    sx={{mr: 2, display: {sm: "none"}}}
                                >
                                    <MenuIcon/>
                                </IconButton>
                                <Typography variant="h6" noWrap component="div" sx={{flexGrow: 1}}>
                                    {drawerRoutes.find((e) => e.path === router.pathname)?.title ?? "zhufucdev"}
                                </Typography>
                            </Toolbar>
                        </AppBar>

                        <Box
                            component="nav"
                            sx={{width: {sm: drawerWidth}, flexShrink: {sm: 0}}}
                            aria-label="drawer content"
                        >
                            <Drawer
                                container={container}
                                variant="temporary"
                                open={mobileOpen}
                                onClose={handleDrawerToggle}
                                ModalProps={{
                                    keepMounted: true, // Better open performance on mobile.
                                }}
                                sx={{
                                    display: {xs: "block", sm: "none"},
                                    "& .MuiDrawer-paper": {
                                        boxSizing: "border-box",
                                        width: drawerWidth,
                                    },
                                }}
                            >
                                {drawerContent}
                            </Drawer>
                            <Drawer
                                variant="permanent"
                                sx={{
                                    display: {xs: "none", sm: "block"},
                                    "& .MuiDrawer-paper": {
                                        boxSizing: "border-box",
                                        width: drawerWidth,
                                    },
                                }}
                                open
                            >
                                {drawerContent}
                            </Drawer>
                        </Box>

                        <Box
                            sx={{
                                flexGrow: 1,
                                p: 3,
                                width: {sm: `calc(100% - ${drawerWidth}px)`},
                            }}
                        >
                            <Toolbar/>
                            <Component {...pageProps} />
                        </Box>
                    </Box>
                    <Analytics/>
                </SnackbarProvider>
            </ThemeProvider>
        </CacheProvider>
    );
}

function getDesignTokens(dark: boolean): ThemeOptions {
    return dark
        ? {
            palette: {
                mode: "dark",
                primary: {
                    main: "#EF6C00",
                },
                secondary: {
                    main: "#00BCD4",
                },
            },
        }
        : {
            palette: {
                mode: "light",
                primary: {
                    main: "#E65100",
                },
                secondary: {
                    main: "#00ACC1",
                },
            },
        };
}

const drawerRoutes = [
    {
        title: "主页",
        path: "/",
        icon: <HomeIcon/>,
        name: "home",
    },
    {
        title: "登录",
        path: "/login",
        name: "login",
        hidden: true,
    },
];

export async function getServerSideProps() {
    return {
        props: {
            recaptchaKey: process.env.RECAPTCHA_KEY_FRONTEND as string
        }
    }
}

export default MyApp;