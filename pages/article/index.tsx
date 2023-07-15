import {GetStaticProps, NextPage} from "next";
import {ArticleUtil, listArticles} from "../../lib/db/article";
import {Box, CircularProgress, Grid, Stack, useTheme} from "@mui/material";
import {Copyright} from "../../componenets/Copyright";
import {Scaffold} from "../../componenets/Scaffold";
import {lookupUser, myId, useProfileContext, useUser} from "../../lib/useUser";
import {useRouter} from "next/router";
import {useTitle} from "../../lib/useTitle";
import React, {useEffect, useState} from "react";
import {motion} from "framer-motion";
import EditIcon from "@mui/icons-material/EditOutlined";

import {getSafeArticle, SafeArticle} from "../../lib/getSafeArticle";
import {getUser, getUsers} from "../../lib/db/user";
import PlaceHolder from "../../componenets/PlaceHolder";
import NoArticleIcon from "@mui/icons-material/PsychologyOutlined";
import {ReCaptchaPolicy} from "../../componenets/ReCaptchaPolicy";
import {ReCaptchaScope} from "../../componenets/ReCaptchaScope";
import {ArticleCard, RenderingArticle} from "../../componenets/ArticleCard";
import useScroll from "../../lib/useScroll";
import {hasPermission} from "../../lib/contract";

type PageProps = {
    articles: RenderingArticle[],
    recaptchaKey: string,
    myName: string,
}

const PostPage: NextPage<PageProps> = (props) => {
    const {user} = useProfileContext();
    const router = useRouter();
    useTitle({appbar: '文章', head: `${props.myName}的博文`})
    return <ReCaptchaScope reCaptchaKey={props.recaptchaKey}>
        <Scaffold
            fabContent={user && hasPermission(user, 'post_article') && <>
                <EditIcon sx={{mr: 1}}/>
                草拟
            </>}
            spacing={1}
            onFabClick={() => router.push('/article/edit')}
        >
            <Content articles={props.articles}/>
            <ReCaptchaPolicy sx={{textAlign: 'center'}}/>
            <Copyright/>
        </Scaffold>
    </ReCaptchaScope>
}

function Content(props: { articles: RenderingArticle[] }): JSX.Element {
    const [loadingProceeding, setProceedingLoading] = useState(false);
    const [proceeding, setProceeding] = useState<SafeArticle[]>();
    const scrolling = useScroll();
    const theme = useTheme();
    const {user} = useUser();

    useEffect(() => {
        if (proceeding || !user) return;
        if (scrolling.height <= 0) return;
        if (window.innerHeight <= scrolling.height && scrolling.height - scrolling.top - window.innerHeight > 10) {
            return;
        }

        setProceedingLoading(true);
        fetch(`/api/article/proceeding`)
            .then(res => res.json() as Promise<SafeArticle[]>)
            .then(getRenderingArticle)
            .then(setProceeding)
            .finally(() => setTimeout(() => setProceedingLoading(false), 1000))
    }, [scrolling, user]);

    if (props.articles.length > 0) {
        return <Stack>
            <Grid container spacing={2}>
                {props.articles.map((data) => (
                    <Grid item key={data._id} flexGrow={1}>
                        <ArticleCard data={data}/>
                    </Grid>
                ))}
            </Grid>
            {loadingProceeding
                && <Box display="flex"
                        justifyContent="center"
                        mt={2}
                        width="100%">
                    <CircularProgress/>
                </Box>}
            <Grid container
                  spacing={2}
                  mt={0}
                  component={motion.div}
                  animate={!loadingProceeding && proceeding ? 'shown' : 'hidden'}
                  variants={{
                      shown: {y: 0, opacity: 1},
                      hidden: {y: -10, opacity: 0}
                  }}
                  transition={{ease: "easeInOut", duration: 0.2}}
            >
                {proceeding?.map(data => (
                    <Grid item key={data._id} flexGrow={1}>
                        <ArticleCard data={data} sx={{borderColor: theme.palette.warning.main}}/>
                    </Grid>
                ))}
            </Grid>
            {(!loadingProceeding && proceeding && proceeding.length <= 0) &&
                <PlaceHolder title="没有更多内容" icon={NoArticleIcon} sx={{mt: 2}}/>}
            <Box height={16}/>
        </Stack>
    } else {
        return (
            <PlaceHolder icon={NoArticleIcon} title="未提供文章"/>
        )
    }
}

export const getStaticProps: GetStaticProps<PageProps> = async () => {
    const articles = await listArticles()
        .then(list =>
            list.filter(ArticleUtil.publicList())
                .sort(
                    (a, b) =>
                        Math.log(b.likes.length + 1) - Math.log(b.dislikes.length + 1)
                        - Math.log(a.likes.length + 1) + Math.log(a.dislikes.length + 1)
                ));
    const users = await getUsers(articles.map(m => m.author));
    const unfolded: RenderingArticle[] = articles.map(m => users(m.author) ? {
        ...getSafeArticle(m),
        authorNick: users(m.author)!.nick
    } : getSafeArticle(m));
    const me = await getUser(myId);

    return {
        props: {
            articles: unfolded,
            recaptchaKey: process.env.RECAPTCHA_KEY_FRONTEND as string,
            myName: me!.nick,
        }
    }
}

export default PostPage;

async function getRenderingArticle(meta: SafeArticle[]): Promise<RenderingArticle[]> {
    let nicknameOf: { [key: string]: string } = {};
    const result: RenderingArticle[] = [];
    for (const article of meta) {
        let nickname: string | undefined = nicknameOf[article.author];
        if (!nickname) {
            nickname = (await lookupUser(article.author))?.nick;
        }
        result.push({...article, authorNick: nickname})
    }
    return result;
}
