import {GetStaticProps, NextPage} from "next";
import {listArticles} from "../../lib/db/article";
import {Grid} from "@mui/material";
import {Copyright} from "../../componenets/Copyright";
import {Scaffold} from "../../componenets/Scaffold";
import {isMe, myId, useUser} from "../../lib/useUser";
import {useRouter} from "next/router";
import {useTitle} from "../../lib/useTitle";
import React from "react";
import {getSafeArticle} from "../../lib/getSafeArticle";

import {getUser, getUsers} from "../../lib/db/user";
import PlaceHolder from "../../componenets/PlaceHolder";
import EditIcon from "@mui/icons-material/EditOutlined";
import NoArticleIcon from "@mui/icons-material/PsychologyOutlined";
import {ReCaptchaPolicy} from "../../componenets/ReCaptchaPolicy";
import {ReCaptchaScope} from "../../componenets/ReCaptchaScope";
import {ArticleCard, RenderingArticle} from "../../componenets/ArticleCard";

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
    if (props.articles.length > 0) {
        return (
            <Grid container spacing={2} key="grid">
                {props.articles.map(data => (
                    <Grid item key={data._id} flexGrow={1}>
                        <ArticleCard data={data}/>
                    </Grid>
                ))}
            </Grid>
        )
    } else {
        return (
            <PlaceHolder icon={NoArticleIcon} title="未提供文章"/>
        )
    }
}

export const getStaticProps: GetStaticProps<PageProps> = async () => {
    const articles = await listArticles()
        .then(list => list.sort(
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