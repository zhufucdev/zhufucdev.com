import HomeIcon from "@mui/icons-material/HomeOutlined";
import ArticleIcon from "@mui/icons-material/ArticleOutlined";
import AboutIcon from "@mui/icons-material/HelpOutline";
import * as React from "react";

const routes = [
    {
        title: '主页',
        route: '/',
        icon: <HomeIcon />,
        name: 'home',
    },
    {
        title: '登录',
        route: '/login',
        name: 'login',
        hidden: true,
    },
    {
        title: '文章',
        route: '/article',
        icon: <ArticleIcon />,
        name: 'articles',
    },
    {
        title: '关于我',
        route: '/me',
        icon: <AboutIcon />,
        name: 'about_me',
    },
]

export default routes;