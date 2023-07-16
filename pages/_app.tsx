import "../styles/globals.sass";
import CssBaseline from "@mui/material/CssBaseline";
import type {AppProps} from "next/app";

import {useRouter} from "next/router";
import * as React from "react";
import {useEffect, useMemo, useRef, useState} from "react";

import Box from "@mui/material/Box";
import Drawer from "@mui/material/Drawer";
import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import List from "@mui/material/List";
import Typography from "@mui/material/Typography";
import Divider from "@mui/material/Divider";
import ListItem from "@mui/material/ListItem";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import HomeIcon from "@mui/icons-material/HomeOutlined";
import MenuIcon from "@mui/icons-material/Menu";
import AboutIcon from "@mui/icons-material/HelpOutline";
import AccountIcon from "@mui/icons-material/AccountCircleOutlined";
import LogoutIcon from "@mui/icons-material/LogoutOutlined";
import LoginIcon from "@mui/icons-material/LoginOutlined";
import ArticleIcon from "@mui/icons-material/ArticleOutlined";
import LanguageIcon from "@mui/icons-material/LanguageOutlined";

import Backdrop from "@mui/material/Backdrop";
import IconButton from "@mui/material/IconButton";
import LinearProgress from "@mui/material/LinearProgress";
import Menu from "@mui/material/Menu";
import MenuList from "@mui/material/MenuList";
import MenuItem from "@mui/material/MenuItem";
import Popover from "@mui/material/Popover";
import Tooltip from "@mui/material/Tooltip";

import {
    ThemeOptions,
    useMediaQuery,
    useScrollTrigger,
    useTheme,
} from "@mui/material";
import {createTheme, ThemeProvider} from "@mui/material/styles";
import {Analytics} from "@vercel/analytics/react";
import Head from "next/head";
import createEmotionCache from "../lib/emotionCache";
import {CacheProvider, EmotionCache} from "@emotion/react";
import Link from "next/link";
import {SnackbarProvider} from "notistack";
import {
    SelfProfileProvider,
    useProfile,
    useProfileContext,
} from "../lib/useUser";
import {LazyAvatar} from "../componenets/LazyAvatar";
import {fetchApi} from "../lib/utility";
import {getResponseRemark} from "../lib/contract";
import {useRequestResult} from "../lib/useRequestResult";
import {getTitle, TitleProvider, useTitle} from "../lib/useTitle";
import {ContentsProvider, useContents} from "../lib/useContents";
import {ContentsNodeComponent} from "../componenets/ContentsNodeComponent";
import LanguageSelect from "../componenets/LanguageSelect";
import {
    LanguageSettings,
    LanguageProvider,
    useLanguage,
} from "../lib/useLanguage";
import {defaultLang, getLanguageName} from "../lib/translation";
import {Caption} from "../componenets/Caption";

export const drawerWidth = 240;

const clientEmotionCache = createEmotionCache();

interface MyAppProps extends AppProps {
    emotionCache?: EmotionCache;
    pageProps: { recaptchaKey: string };
}

type MyAppBarProps = {
    onToggleDrawer: () => void;
};

function MyAppBar(props: MyAppBarProps): JSX.Element {
    const theme = useTheme();
    const router = useRouter();

    const {user, mutateUser, isLoading: isUserLoading} = useProfileContext();
    const handleResult = useRequestResult();
    const [_title] = useTitle();
    const title = useMemo(() => getTitle(_title, false), [_title]);
    const [userMenuAnchor, setUserMenuAnchor] = React.useState<HTMLElement>();
    const [langOptions, , setTargetLang] = useLanguage();

    const handleLogout = async () => {
        const res = await fetchApi("/api/login", {logout: true});
        const remark = await getResponseRemark(res);
        handleResult(remark);
        await mutateUser(undefined);
        setUserMenuAnchor(undefined);
    };
    const dismissHandler = () => setUserMenuAnchor(undefined);

    const scrolled = useScrollTrigger({
        disableHysteresis: true,
        threshold: 0,
    });
    const useSurfaceColor = theme.palette.mode === "light" && !scrolled;
    const menuItemColor = useSurfaceColor ? "default" : "inherit";

    return (
        <AppBar
            position="fixed"
            sx={{
                width: {sm: `calc(100% - ${drawerWidth}px)`},
                ml: `${drawerWidth}px`,
                background: scrolled ? undefined : "transparent", // for user cover
            }}
            elevation={scrolled ? 4 : 0}
        >
            <Toolbar>
                <IconButton
                    color={menuItemColor}
                    aria-label="open drawer"
                    edge="start"
                    onClick={props.onToggleDrawer}
                    sx={{mr: 2, display: {sm: "none"}}}
                >
                    <MenuIcon/>
                </IconButton>
                <Typography
                    variant="h6"
                    noWrap
                    color={useSurfaceColor ? "text.primary" : "inherit"}
                    component="div"
                    sx={{flexGrow: 1}}
                >
                    {title}
                </Typography>
                {langOptions && (
                    <LanguageSelect
                        current={langOptions.current ?? defaultLang}
                        available={langOptions.available}
                        sx={{
                            mr: 2,
                            [theme.breakpoints.down("md")]: {display: "none"},
                        }}
                        onLanguageSwitched={setTargetLang}
                    />
                )}
                {langOptions && (
                    <LanguageSwitch
                        settings={langOptions}
                        onSwitched={setTargetLang}
                    />
                )}
                <Tooltip
                    title={isUserLoading ? "" : user ? user.nick : "未登录"}
                >
                    <span>
                        <IconButton
                            onClick={(ev) =>
                                setUserMenuAnchor(ev.currentTarget)
                            }
                            disabled={isUserLoading}
                            color={menuItemColor}
                        >
                            {user ? (
                                <LazyAvatar
                                    user={user}
                                    size={32}
                                    loading={isUserLoading}
                                />
                            ) : (
                                <AccountIcon/>
                            )}
                        </IconButton>
                    </span>
                </Tooltip>
                <Menu
                    open={Boolean(userMenuAnchor)}
                    anchorEl={userMenuAnchor}
                    onClose={() => setUserMenuAnchor(undefined)}
                    transformOrigin={{
                        vertical: "top",
                        horizontal: "right",
                    }}
                    anchorOrigin={{
                        vertical: "bottom",
                        horizontal: "center",
                    }}
                >
                    <MenuList>
                        {user ? (
                            <>
                                <MenuItem
                                    component={Link}
                                    href={`/me/${user._id}`}
                                    onClick={dismissHandler}
                                >
                                    <ListItemIcon>
                                        <AccountIcon fontSize="small"/>
                                    </ListItemIcon>
                                    <ListItemText>我的主页</ListItemText>
                                </MenuItem>
                                <MenuItem onClick={handleLogout}>
                                    <ListItemIcon>
                                        <LogoutIcon fontSize="small"/>
                                    </ListItemIcon>
                                    <ListItemText>退出账号</ListItemText>
                                </MenuItem>
                            </>
                        ) : (
                            <MenuItem
                                component={Link}
                                href="/login"
                                onClick={() => {
                                    dismissHandler();
                                    localStorage.setItem(
                                        "login_from",
                                        router.pathname,
                                    );
                                }}
                            >
                                <ListItemIcon>
                                    <LoginIcon fontSize="small"/>
                                </ListItemIcon>
                                <ListItemText>登录</ListItemText>
                            </MenuItem>
                        )}
                    </MenuList>
                </Menu>
            </Toolbar>
        </AppBar>
    );
}

function MyHead() {
    const [_title] = useTitle();
    const title = useMemo(() => getTitle(_title, true), [_title]);
    return (
        <Head>
            <title>{title}</title>
        </Head>
    );
}

function LanguageSwitch(props: {
    settings: LanguageSettings;
    onSwitched: (target: string) => void;
}) {
    const theme = useTheme();
    const [open, setOpen] = useState(false);
    const icon = useRef(null);

    return (
        <>
            <Tooltip title="语言">
                <span>
                    <IconButton
                        sx={{
                            [theme.breakpoints.up("md")]: {display: "none"},
                        }}
                        onClick={() => setOpen(true)}
                        ref={icon}
                    >
                        <LanguageIcon/>
                    </IconButton>
                </span>
            </Tooltip>
            <Popover
                open={open}
                onClose={() => setOpen(false)}
                anchorEl={icon.current}
                transformOrigin={{
                    vertical: "top",
                    horizontal: "right",
                }}
                anchorOrigin={{
                    vertical: "bottom",
                    horizontal: "right",
                }}
            >
                <Caption noWrap mt={2} mb={-1} ml={2} mr={2}>
                    在其他语言中查看
                </Caption>
                <List>
                    {props.settings.available.map(({name, href}) => (
                        <ListItemButton
                            key={name}
                            onClick={() => {
                                setOpen(false);
                                props.onSwitched(name);
                            }}
                            selected={props.settings.current === name}
                            component={Link}
                            href={href}
                        >
                            {getLanguageName(name)}
                        </ListItemButton>
                    ))}
                </List>
            </Popover>
        </>
    );
}

function MyDrawerContent(props: { onItemClicked: () => void }) {
    const router = useRouter();
    const [root] = useContents();

    return (
        <>
            <Toolbar/>
            <Divider/>
            <List
                sx={{
                    ".MuiListItemButton-root": {
                        borderTopRightRadius: 20,
                        borderBottomRightRadius: 20,
                    },
                }}
            >
                {routes
                    .filter((e) => !e.hidden)
                    .map((entry) => (
                        <Box key={entry.name}>
                            <ListItem disablePadding>
                                <ListItemButton
                                    onClick={props.onItemClicked}
                                    component={Link}
                                    href={entry.route!}
                                    selected={entry.route === router.pathname}
                                >
                                    <ListItemIcon>{entry.icon}</ListItemIcon>
                                    <ListItemText primary={entry.title}/>
                                </ListItemButton>
                            </ListItem>
                            {entry.name === root?.target && (
                                <Box
                                    sx={{
                                        display: {sm: "block", md: "none"},
                                    }}
                                >
                                    <ContentsNodeComponent
                                        node={root}
                                        onClick={props.onItemClicked}
                                    />
                                </Box>
                            )}
                        </Box>
                    ))}
            </List>
        </>
    );
}

function MyBackdrop() {
    const router = useRouter();
    const [transiting, setTransiting] = useState(false);
    const [progress, setProgress] = useState(-1);
    useEffect(() => {
        let timer: NodeJS.Timer;

        function onHandler() {
            setTransiting(true);
            setProgress(0);
            let i = 1;
            timer = setInterval(() => {
                if (transiting) clearInterval(timer);
                else {
                    setProgress(100 - 100 / i);
                    i++;
                }
            }, 100);
        }

        function offHandler() {
            setTransiting(false);
            setProgress(100);
        }

        router.events.on("routeChangeStart", onHandler);
        router.events.on("routeChangeComplete", offHandler);
        router.events.on("routeChangeError", offHandler);

        return () => {
            router.events.off("routeChangeStart", onHandler);
            router.events.off("routeChangeComplete", offHandler);
            router.events.off("routeChangeError", offHandler);
        };
    }, [router]);

    return (
        <Backdrop
            open={transiting}
            unmountOnExit
            sx={{zIndex: 10000, transitionDelay: "400ms"}}
        >
            <LinearProgress
                variant="determinate"
                value={progress}
                sx={{position: "absolute", top: 0, width: "100%"}}
            />
        </Backdrop>
    );
}

function MyApp({
                   Component,
                   pageProps,
                   emotionCache = clientEmotionCache,
               }: MyAppProps) {
    const router = useRouter();
    const [mobileOpen, setMobileOpen] = React.useState(false);
    const selfProfile = useProfile();

    const handleDrawerToggle = () => {
        setMobileOpen(!mobileOpen);
    };

    const prefersDark = useMediaQuery("(prefers-color-scheme: dark)");
    const theme = React.useMemo(
        () => createTheme(getDesignTokens(prefersDark)),
        [prefersDark],
    );

    return (
        <CacheProvider value={emotionCache}>
            <ThemeProvider theme={theme}>
                <TitleProvider
                    title={
                        routes.find((e) => e.route === router.pathname)?.title
                    }
                >
                    <ContentsProvider>
                        <MyHead/>
                        <MyBackdrop/>
                        <SnackbarProvider>
                            <SelfProfileProvider {...selfProfile}>
                                <LanguageProvider>
                                    <Box sx={{display: "flex"}}>
                                        <CssBaseline/>
                                        <MyAppBar
                                            onToggleDrawer={handleDrawerToggle}
                                        />

                                        <Box
                                            component="nav"
                                            sx={{
                                                width: {sm: drawerWidth},
                                                flexShrink: {sm: 0},
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
                                                        xs: "block",
                                                        sm: "none",
                                                    },
                                                    "& .MuiDrawer-paper": {
                                                        boxSizing: "border-box",
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
                                                        xs: "none",
                                                        sm: "block",
                                                    },
                                                    "& .MuiDrawer-paper": {
                                                        boxSizing: "border-box",
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
                                            <Toolbar/>
                                            <Component {...pageProps} />
                                        </Box>
                                    </Box>
                                    <Analytics/>
                                </LanguageProvider>
                            </SelfProfileProvider>
                        </SnackbarProvider>
                    </ContentsProvider>
                </TitleProvider>
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

const routes = [
    {
        title: "主页",
        route: "/",
        icon: <HomeIcon/>,
        name: "home",
    },
    {
        title: "登录",
        route: "/login",
        name: "login",
        hidden: true,
    },
    {
        title: "文章",
        route: "/article",
        icon: <ArticleIcon/>,
        name: "articles",
    },
    {
        title: "关于我",
        route: "/me",
        icon: <AboutIcon/>,
        name: "about_me",
    },
];

export async function getServerSideProps() {
    return {
        props: {
            recaptchaKey: process.env.RECAPTCHA_KEY_FRONTEND as string,
        },
    };
}

export default MyApp;
