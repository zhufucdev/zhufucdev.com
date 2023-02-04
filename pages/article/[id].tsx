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
import {ContentsNode, useContents} from "../../lib/useContents";
import {useEffect, useRef} from "react";

type PageProps = {
    meta?: SafeArticle,
    authorNick?: string,
    body?: string
}

const ArticleApp: NextPage<PageProps> = ({meta, body, authorNick}) => {
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
    const [, setContents] = useContents();
    const articleRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
        if (!articleRef.current) {
            setContents(undefined);
            return
        }

        let index = 0;
        function generateNode(ele: Element, coll: HTMLCollection): ContentsNode | undefined {
            function getLevel(ele?: Element): number {
                if (!ele || ele.tagName.length !== 2 || ele.tagName.charAt(0).toLowerCase() !== 'h') return 0;
                return parseInt(ele.tagName.charAt(1));
            }

            const lv = getLevel(ele);

            index++
            if (lv <= 0) {
                return undefined;
            }

            const children: ContentsNode[] = [];
            while (true) {
                const next = coll[index];
                const nextLv = getLevel(next);

                if (nextLv > lv) {
                    const node = generateNode(next, coll);
                    if (node) {
                        children.push(node);
                    }
                } else {
                    break;
                }
                index++
            }
            ele.textContent && ele.setAttribute('id', ele.textContent);
            return {
                title: ele.textContent ?? '',
                element: ele,
                href: `#${ele.textContent}`,
                children
            }
        }

        const elements = articleRef.current.children;
        const tree: ContentsNode[] = [];

        while (index < elements.length) {
            const node = generateNode(elements[index]!, elements);
            if (node) tree.push(node);
        }
        setContents({
            target: 'articles',
            nodes: tree
        });
    }, [articleRef]);

    return <>
        <ArticleHeader title={meta!.title} cover={meta!.cover}/>
        <Typography variant="body2" color="text.secondary">
            由{authorNick ?? meta!.author}发布于{getHumanReadableTime(new Date(meta!.postTime))}
        </Typography>
        <Box ref={articleRef}>
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
