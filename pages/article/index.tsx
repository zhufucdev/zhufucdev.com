import {GetStaticProps, NextPage} from "next";
import {listArticles} from "../../lib/db/article";
import {Box, CircularProgress, Fade, Grid, Stack, Typography, useScrollTrigger} from "@mui/material";
import {Copyright} from "../../componenets/Copyright";
import {Scaffold} from "../../componenets/Scaffold";
import {isMe, myId, useUser} from "../../lib/useUser";
import {useRouter} from "next/router";
import {useTitle} from "../../lib/useTitle";
import React, {useCallback, useEffect, useRef, useState} from "react";
import {getSafeArticle, SafeArticle} from "../../lib/getSafeArticle";

import {getUser, getUsers} from "../../lib/db/user";
import PlaceHolder from "../../componenets/PlaceHolder";
import EditIcon from "@mui/icons-material/EditOutlined";
import NoArticleIcon from "@mui/icons-material/PsychologyOutlined";
import {ReCaptchaPolicy} from "../../componenets/ReCaptchaPolicy";
import {ReCaptchaScope} from "../../componenets/ReCaptchaScope";
import {ArticleCard, RenderingArticle} from "../../componenets/ArticleCard";
import {readTags} from "../../lib/tagging";
import useScroll from "../../lib/useScroll";
import {motion} from "framer-motion";
import {Caption} from "../../componenets/Caption";

type PageProps = {
    articles: RenderingArticle[],
    recaptchaKey: string,
    myName: string,
}

const PostPage: NextPage<PageProps> = (props) => {
    const {user} = useUser();
    const router = useRouter();
    useTitle({appbar: '文章', head: `${props.myName}的博文`})
    return <ReCaptchaScope reCaptchaKey={props.recaptchaKey}>
        <Scaffold
            fabContent={user && isMe(user) && <>
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

    useEffect(() => {
        if (proceeding) return;
        if (scrolling.top + window.innerHeight - scrolling.height > 10) {
            return;
        }

        setProceedingLoading(true);
        fetch(`/api/article/proceeding`)
            .then(res => res.json() as Promise<SafeArticle[]>)
            .then(setProceeding)
            .then(() => setTimeout(() => setProceedingLoading(false), 1000));
    }, [scrolling]);

    if (props.articles.length > 0) {
        return <Stack>
            <Grid container spacing={2}>
                {props.articles.map((data, i) => (
                    <Grid item key={data._id} flexGrow={1}>
                        <ArticleCard data={data}/>
                    </Grid>
                ))}
            </Grid>
            <Caption mt={2}>额外</Caption>
            <Box display={loadingProceeding ? 'flex' : 'none'}
                 mt={2}
                 justifyContent="center"
                 width="100%">
                <CircularProgress/>
            </Box>
            <Grid container
                  spacing={2}
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
                        <ArticleCard data={data}/>
                    </Grid>
                ))}
            </Grid>
            {(!loadingProceeding && proceeding && proceeding.length <= 0) &&
                <PlaceHolder title="没有更多内容" icon={NoArticleIcon}/>}
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
            list.filter(meta => !readTags(meta).hidden)
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