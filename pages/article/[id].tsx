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
import {Contents, ContentsNode, useContents} from "../../lib/useContents";
import {useEffect, useRef, useState} from "react";
import {useMediaQuery, useTheme} from "@mui/material";
import {ContentsNodeComponent} from "../../componenets/ContentsNodeComponent";
import List from "@mui/material/List";
import {motion} from "framer-motion";

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
    const theme = useTheme();
    const onLargeScreen = useMediaQuery(theme.breakpoints.up('md'));
    const [contents, setContents] = useContents();
    const articleRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
        if (!articleRef.current) {
            setContents(undefined);
            return
        }

        setContents(generateNodeTree(articleRef.current));
    }, [articleRef]);
    const [scrolled, setScrolled] = useState(false);

    return <>
        <ArticleHeader title={meta!.title} cover={meta!.cover} onScroll={setScrolled}/>
        <Typography variant="body2" color="text.secondary">
            由{authorNick ?? meta!.author}发布于{getHumanReadableTime(new Date(meta!.postTime))}
        </Typography>
        <Box ref={articleRef} sx={{width: onLargeScreen ? '70%' : '100%'}}>
            <MarkdownScope>{body}</MarkdownScope>
        </Box>
        {onLargeScreen && contents &&
            <motion.div
                animate={{y: scrolled || !Boolean(meta?.cover) ? 0 : 180}}
                style={{
                    width: 'calc(30% - 100px)',
                    position: 'fixed',
                    top: '70px',
                    bottom: 100,
                    right: 10,
                    overflowY: 'auto'
                }}
            >
                <List>
                    <ContentsNodeComponent node={contents}/>
                </List>
            </motion.div>
        }
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

function generateNodeTree(root: HTMLDivElement): Contents {
    let index = 0;

    function generateNode(ele: Element, coll: HTMLCollection): ContentsNode | undefined {
        function getLevel(ele?: Element): number {
            if (!ele || ele.tagName.length !== 2 || ele.tagName.charAt(0).toLowerCase() !== 'h') return 0;
            return parseInt(ele.tagName.charAt(1));
        }

        const lv = getLevel(ele);

        if (lv <= 0) {
            index++;
            return undefined;
        }

        const children: ContentsNode[] = [];
        while (true) {
            const next = coll[index];
            index++;

            if (!next) break;
            const nextLv = getLevel(next);

            if (nextLv > lv) {
                const node = generateNode(next, coll);
                if (node) {
                    children.push(node);
                }
            } else if (nextLv > 0) {
                break;
            }
        }
        ele.textContent && ele.setAttribute('id', ele.textContent);
        return {
            title: ele.textContent ?? '',
            element: ele,
            href: `#${ele.textContent}`,
            children
        }
    }

    const elements = root.children;
    const tree: ContentsNode[] = [];

    while (index < elements.length) {
        const node = generateNode(elements[index]!, elements);
        if (node) tree.push(node);
    }

    return {
        target: 'articles',
        nodes: tree
    }
}
