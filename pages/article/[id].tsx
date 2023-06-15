import {GetStaticPaths, GetStaticProps, NextPage} from "next";
import {getArticle, listArticles} from "../../lib/db/article";
import {getSafeArticle, SafeArticle} from "../../lib/getSafeArticle";
import Typography from "@mui/material/Typography";
import {MarkdownScope} from "../../componenets/MarkdownScope";
import {getHumanReadableTime, readAll} from "../../lib/utility";
import PlaceHolder from "../../componenets/PlaceHolder";
import NoContentIcon from "@mui/icons-material/PsychologyOutlined";
import NoArticleIcon from "@mui/icons-material/PowerOffOutlined";
import {Copyright} from "../../componenets/Copyright";
import {getUser} from "../../lib/db/user";
import {ArticleHeader} from "../../componenets/ArticleHeader";
import Box from "@mui/material/Box";
import {useRef} from "react";
import {useMediaQuery, useTheme} from "@mui/material";
import {useTitle} from "../../lib/useTitle";

type PageProps = {
    meta?: SafeArticle,
    authorNick?: string,
    body?: string
}

const ArticleApp: NextPage<PageProps> = ({meta, body, authorNick}) => {
    useTitle({appbar: '文章', head: meta?.title ?? '文章'});

    if (meta) {
        if (body) {
            return <ArticleBody meta={meta} body={body} authorNick={authorNick}/>
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

function ArticleBody({meta, body, authorNick}: PageProps) {
    const theme = useTheme();
    const onLargeScreen = useMediaQuery(theme.breakpoints.up('md'));
    const articleRef = useRef<HTMLDivElement>(null);

    return <>
        <ArticleHeader title={meta!.title} cover={meta!.cover} article={articleRef}/>
        <Typography variant="body2" color="text.secondary">
            由{authorNick ?? meta!.author}发布于{getHumanReadableTime(new Date(meta!.postTime))}
        </Typography>
        <Box ref={articleRef} sx={{width: onLargeScreen ? 'calc(100% - 240px)' : '100%'}}>
            <MarkdownScope>{body}</MarkdownScope>
        </Box>
        <Copyright/>
    </>
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