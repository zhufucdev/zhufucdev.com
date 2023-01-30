import {GetStaticPaths, GetStaticProps, NextPage} from "next";
import {getArticle, listArticles} from "../../lib/db/article";
import {getSafeArticle, SafeArticle} from "../../lib/getSafeArticle";
import Typography from "@mui/material/Typography";
import {MarkdownScope} from "../../componenets/MarkdownScope";
import {getHumanReadableTime, readAll} from "../../lib/utility";
import PlaceHolder from "../../componenets/PlaceHolder";
import NoContentIcon from "@mui/icons-material/PsychologyOutlined";
import NoArticleIcon from "@mui/icons-material/PowerOffOutlined";
import {useScrollTrigger} from "@mui/material";
import {useEffect, useRef, useState} from "react";
import {useTitle} from "../../lib/useTitle";
import {Copyright} from "../../componenets/Copyright";
import {getUser} from "../../lib/db/user";

type PageProps = {
    meta?: SafeArticle,
    authorNick?: string,
    body?: string
}

const ArticleApp: NextPage<PageProps> = ({meta, body, authorNick}) => {
    if (meta) {
        if (body) {
            return <>
                <Title title={meta.title}/>
                <Typography variant="body2" color="text.secondary">
                    由{authorNick ?? meta.author}发布于{getHumanReadableTime(new Date(meta.postTime))}
                </Typography>
                <MarkdownScope>{body}</MarkdownScope>
                <Copyright/>
            </>
        } else {
            return <>
                <Typography variant="h3">{meta?.title}</Typography>
                <PlaceHolder icon={NoContentIcon} title="作者骗了你，没写正文"/>
            </>
        }
    } else {
        return <PlaceHolder icon={NoArticleIcon} title="文章未找到"/>
    }
}

function Title(props: { title: string }): JSX.Element {
    const titleRef = useRef<HTMLTitleElement>(null);
    const [titleHeight, setTitleHeight] = useState(0);
    const scrolled = useScrollTrigger({threshold: titleHeight, disableHysteresis: true});
    const [, setTitle] = useTitle('文章')
    useEffect(() => {
        setTitleHeight(titleRef.current?.clientHeight ?? 0);
    }, [titleRef]);
    useEffect(() => {
        if (scrolled)
            setTitle(props.title);
        else
            setTitle('文章')
    }, [scrolled, props.title]);
    return <Typography variant="h3" ref={titleRef}>{props.title}</Typography>
}

export const getStaticProps: GetStaticProps<PageProps> = async (context) => {
    const {id} = context.params!;
    const meta = await getArticle(id as ArticleID);
    const stream = meta?.stream();
    const body = stream && (await readAll(stream)).toString();
    const props: PageProps = {};
    if (meta) {
        props.meta = getSafeArticle(meta);
        const user = await getUser(meta.author);
        if (user) props.authorNick = user.nick;
    }
    if (body) {
        props.body = body;
    }
    return {props, revalidate: false}
}

export const getStaticPaths: GetStaticPaths = async () => {
    const articles = await listArticles();
    return {
        paths: articles.map(meta => ({params: {id: meta._id}})),
        fallback: 'blocking'
    }
};

export default ArticleApp;
