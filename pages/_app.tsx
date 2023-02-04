import "../styles/globals.sass";
import CssBaseline from "@mui/material/CssBaseline";
import type {AppProps} from "next/app";

import {useRouter} from "next/router";
import * as React from "react";

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

import {
    IconButton,
    Menu,
    MenuItem, MenuList,
    ThemeOptions,
    Tooltip,
    useMediaQuery,
    useScrollTrigger
} from "@mui/material";
import {createTheme, ThemeProvider} from "@mui/material/styles";
import {Analytics} from "@vercel/analytics/react";
import Head from "next/head";
import createEmotionCache from "../lib/emotionCache";
import {CacheProvider, EmotionCache} from "@emotion/react";
import Link from "next/link";
import {SnackbarProvider} from "notistack";
import {useUser} from "../lib/useUser";
import {LazyAvatar} from "../componenets/LazyAvatar";
import {fetchApi} from "../lib/utility";
import {getResponseRemark} from "../lib/contract";
import {useRequestResult} from "../lib/useRequestResult";
import {TitleProvider, useTitle} from "../lib/useTitle";
import {ContentsNodeState, ContentsProvider, ContentsRootNode, useContents} from "../lib/useContents";
import {useEffect, useMemo, useState} from "react";

export const drawerWidth = 240;

const clientEmotionCache = createEmotionCache();

interface MyAppProps extends AppProps {
    emotionCache?: EmotionCache,
    pageProps: { recaptchaKey: string }
}

type MyAppBarProps = {
    onToggleDrawer: () => void,
};

function MyAppBar(props: MyAppBarProps): JSX.Element {
    const {user, mutateUser, isLoading: isUserLoading} = useUser();
    const handleResult = useRequestResult();
    const [title] = useTitle();
    const [userMenuAnchor, setUserMenuAnchor] = React.useState<HTMLElement>();

    const handleLogout = async () => {
        const res = await fetchApi('/api/login', {logout: true});
        const remark = await getResponseRemark(res);
        handleResult(remark);
        await mutateUser(undefined);
        setUserMenuAnchor(undefined);
    };
    const dismissHandler = () => setUserMenuAnchor(undefined);

    const trigger = useScrollTrigger({disableHysteresis: true, threshold: 0});

    return (
        <AppBar
            position="fixed"
            sx={{
                width: {sm: `calc(100% - ${drawerWidth}px)`},
                ml: `${drawerWidth}px`,
                background: trigger ? undefined : 'transparent' // for user cover
            }}
            elevation={trigger ? 4 : 0}
        >
            <Toolbar>
                <IconButton
                    color="inherit"
                    aria-label="open drawer"
                    edge="start"
                    onClick={props.onToggleDrawer}
                    sx={{mr: 2, display: {sm: "none"}}}
                >
                    <MenuIcon/>
                </IconButton>
                <Typography variant="h6" noWrap component="div" sx={{flexGrow: 1}}>
                    {title || 'zhufucdev'}
                </Typography>
                <Tooltip title={isUserLoading ? "" : (user ? user : "未登录")}>
                    <span>
                    <IconButton
                        onClick={ev => setUserMenuAnchor(ev.currentTarget)}
                        disabled={isUserLoading}
                        color="inherit"
                    >
                        {
                            user
                                ? <LazyAvatar userId={user} size={32} loading={isUserLoading}/>
                                : <AccountIcon/>
                        }
                    </IconButton>
                    </span>
                </Tooltip>
                <Menu
                    open={Boolean(userMenuAnchor)}
                    anchorEl={userMenuAnchor}
                    onClose={() => setUserMenuAnchor(undefined)}
                    transformOrigin={{
                        vertical: "top",
                        horizontal: "right"
                    }}
                    anchorOrigin={{
                        vertical: "bottom",
                        horizontal: "center"
                    }}
                >
                    <MenuList>
                        {
                            user
                                ? <>
                                    <MenuItem component={Link} href={`/me/${user}`} onClick={dismissHandler}>
                                        <ListItemIcon><AccountIcon fontSize="small"/></ListItemIcon>
                                        <ListItemText>我的主页</ListItemText>
                                    </MenuItem>
                                    <MenuItem onClick={handleLogout}>
                                        <ListItemIcon><LogoutIcon fontSize="small"/></ListItemIcon>
                                        <ListItemText>退出账号</ListItemText>
                                    </MenuItem>
                                </>
                                : <MenuItem component={Link} href="/login" onClick={dismissHandler}>
                                    <ListItemIcon><LoginIcon fontSize="small"/></ListItemIcon>
                                    <ListItemText>登录</ListItemText>
                                </MenuItem>
                        }
                    </MenuList>
                </Menu>
            </Toolbar>
        </AppBar>
    )
}

function MyHead() {
    const [title] = useTitle();
    return <Head><title>{title}</title></Head>
}

function MyDrawerContent(props: { onItemClicked: () => void }) {
    const router = useRouter();
    const [root, setContents] = useContents();

    useEffect(() => {
        router.events.on('routeChangeStart', () => {
            setContents({
                target: '',
                nodes: []
            })
        })
    }, [router]);

    return <>
        <Toolbar/>
        <Divider/>
        <List sx={{
            '.MuiListItemButton-root': {
                borderTopRightRadius: 20,
                borderBottomRightRadius: 20
            }
        }}>
            {routes
                .filter((e) => !e.hidden)
                .map((entry) => (<>
                        <ListItem key={entry.name} disablePadding>
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
                        {entry.name === root?.target &&
                            <ContentsNodeComponent node={root}/>
                        }
                    </>
                ))}
        </List>
    </>
}

function ContentsNodeComponent(props: { node: ContentsNodeState, indent?: number, current?: string }) {
    const {node, indent} = props;

    function Item(props: { title: string, href: string, indent: number, selected: boolean }) {
        return <ListItem disablePadding>
            <ListItemButton
                component={Link}
                href={props.href}
                selected={props.selected}
            >
                <ListItemText sx={{ml: props.indent}}>{props.title}</ListItemText>
            </ListItemButton>
        </ListItem>
    }

    const [currentTitle, setCurrentTitle] = useState(node.children[0]?.id ?? '');
    useEffect(() => {
        // an optimums algorithm to find the current header:
        // - single event handler
        // - cache
        if (!indent) {
            // this is a root node
            const nodesUnfolded: ContentsNodeState[] = [];

            function unfold(node: ContentsNodeState) {
                if (!ContentsRootNode.isNodeRoot(node))
                    nodesUnfolded.push(node)
                node.children.forEach(unfold);
            }

            unfold(node);

            let from = 0, lastScrolling = 0;

            function findAppropriateNode(from: number, reverse: boolean): number {
                function getDistance(index: number) {
                    return Math.abs(nodesUnfolded[index].element.getBoundingClientRect().y)
                }

                let min = getDistance(from);
                let i;
                if (reverse) {
                    for (i = from - 1; i >= 0; i--) {
                        const curr = getDistance(i);
                        if (curr > min) {
                            return i + 1;
                        }
                    }
                    return 0;
                } else {
                    for (i = from + 1; i < nodesUnfolded.length; i++) {
                        const curr = getDistance(i);
                        if (curr > min) {
                            return i - 1;
                        }
                    }
                    return nodesUnfolded.length - 1;
                }
            }

            function scrollHandler() {
                const curr = window.scrollY;
                from = findAppropriateNode(from, curr < lastScrolling);
                lastScrolling = curr;
                setCurrentTitle(nodesUnfolded[from].id);
            }

            window.removeEventListener('scroll', scrollHandler);
            window.addEventListener('scroll', scrollHandler);
        }
    }, [indent]);

    const selected = useMemo(() => props.node.id === props.current, [props.current]);

    return <>
        {indent && <Item key="master"
                         title={node.title}
                         href={node.href}
                         indent={indent}
                         selected={selected}/>}
        {
            node.children.map(n =>
                <ContentsNodeComponent
                    node={n}
                    indent={(indent ?? 0) + 1}
                    key={n.element.textContent}
                    current={indent ? props.current : currentTitle}
                />
            )
        }
    </>
}

function MyApp({Component, pageProps, emotionCache = clientEmotionCache}: MyAppProps) {
    const router = useRouter();
    const [mobileOpen, setMobileOpen] = React.useState(false);

    const handleDrawerToggle = () => {
        setMobileOpen(!mobileOpen);
    };

    const prefersDark = useMediaQuery("(prefers-color-scheme: dark)");
    const theme = React.useMemo(
        () => createTheme(getDesignTokens(prefersDark)),
        [prefersDark]
    );

    return (
        <CacheProvider value={emotionCache}>
            <ThemeProvider theme={theme}>
                <TitleProvider title={routes.find(e => e.route === router.pathname)?.title}>
                    <ContentsProvider>
                        <MyHead/>
                        <SnackbarProvider>
                            <Box sx={{display: "flex"}}>
                                <CssBaseline/>
                                <MyAppBar onToggleDrawer={handleDrawerToggle}/>

                                <Box
                                    component="nav"
                                    sx={{width: {sm: drawerWidth}, flexShrink: {sm: 0}}}
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
                                            display: {xs: "block", sm: "none"},
                                            "& .MuiDrawer-paper": {
                                                boxSizing: "border-box",
                                                width: drawerWidth,
                                            },
                                        }}
                                    >
                                        <MyDrawerContent onItemClicked={handleDrawerToggle}/>
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
                                        <MyDrawerContent onItemClicked={handleDrawerToggle}/>
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
        name: "articles"
    },
    {
        title: "关于我",
        route: "/me",
        icon: <AboutIcon/>,
        name: "about_me",
    }
];

export async function getServerSideProps() {
    return {
        props: {
            recaptchaKey: process.env.RECAPTCHA_KEY_FRONTEND as string
        }
    }
}

export default MyApp;