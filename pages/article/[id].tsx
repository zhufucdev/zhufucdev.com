import {GetStaticPaths, GetStaticProps, NextPage} from "next";
import {Article, ArticleUtil, getArticle, listArticles} from "../../lib/db/article";
import {getSafeArticle} from "../../lib/getSafeArticle";
import Typography from "@mui/material/Typography";
import {MarkdownScope} from "../../componenets/MarkdownScope";
import {readAll} from "../../lib/utility";
import PlaceHolder from "../../componenets/PlaceHolder";
import NoContentIcon from "@mui/icons-material/PsychologyOutlined";
import NoArticleIcon from "@mui/icons-material/PowerOffOutlined";
import {Copyright} from "../../componenets/Copyright";
import {getUser} from "../../lib/db/user";
import {ArticleHeader} from "../../componenets/ArticleHeader";
import Box from "@mui/material/Box";
import {useEffect, useMemo, useRef} from "react";
import {useMediaQuery, useTheme} from "@mui/material";
import {useTitle} from "../../lib/useTitle";
import {ArticleDescription} from "../../componenets/ArticleDescription";
import {RenderingArticle} from "../../componenets/ArticleCard";
import {useLanguage} from "../../lib/useLanguage";
import {defaultLang} from "../../lib/translation";
import {useRouter} from "next/router";

type PageProps = {
    meta?: RenderingArticle,
    body?: string
}

const ArticleApp: NextPage<PageProps> = ({meta, body}) => {
    useTitle({appbar: '文章', head: meta?.title ?? '文章'});
    const router = useRouter();
    const languageList = useMemo(() => {
        if (!meta || !meta.altLangs) return [];
        const list: string[] = [];
        for (const key in meta.altLangs) {
            list.push(key);
        }
        return list;
    }, [meta]);
    const [options, _, __] =
        useLanguage(meta && languageList ? {
            current: (meta.tags.lang as string) ?? defaultLang,
            available: languageList
        } : undefined);

    useEffect(() => {
        if (!options || !options.current) return;
        const targetId = meta!.altLangs![options.current];
        router.push(`/article/${targetId}`)
    }, [options]);

    if (meta) {
        if (body) {
            return <>
                <ArticleBody meta={meta!} body={body}/>
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

function ArticleBody({meta, body}: PageProps) {
    const theme = useTheme();
    const onLargeScreen = useMediaQuery(theme.breakpoints.up('md'));
    const articleRef = useRef<HTMLDivElement>(null);

    return <>
        <ArticleHeader meta={meta!} article={articleRef}/>
        <ArticleDescription data={meta!}/>
        <Box ref={articleRef} sx={{width: onLargeScreen ? 'calc(100% - 240px)' : '100%'}}>
            <MarkdownScope>{body}</MarkdownScope>
        </Box>
    </>
}

export const getStaticProps: GetStaticProps<PageProps> = async (context) => {
    const {id} = context.params!;
    const meta = await getArticle(id as ArticleID);
    const stream = meta?.stream();
    const body = stream && (await readAll(stream)).toString();
    const props: PageProps = {};
    if (meta) {
        const user = await getUser(meta.author);
        let variants: Article[] = [];
        if (meta.tags["t-from"]) {
            const origin = await getArticle(meta.tags["t-from"] as string);
            if (origin) {
                variants = await listArticles({tags: {"t-from": origin._id}});
                variants.push(origin);
            }
        } else {
            variants = await listArticles({tags: {"t-from": meta._id}});
            variants.push(meta);
        }

        const altLangs: { [key: string]: string } = {};
        variants.forEach(v => {
            altLangs[(v.tags.lang ?? defaultLang) as string] = v._id;
        })

        props.meta = {...getSafeArticle(meta), authorNick: user?.nick, altLangs};
    }
    if (body) {
        props.body = body;
    }
    return {props, revalidate: false}
}

export const getStaticPaths: GetStaticPaths = async () => {
    const articles = await listArticles();
    return {
        paths: articles.filter(ArticleUtil.publicList()).map(meta => ({params: {id: meta._id}})),
        fallback: 'blocking'
    }
};

export default ArticleApp;