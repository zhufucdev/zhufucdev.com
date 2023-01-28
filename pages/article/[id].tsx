import {GetServerSideProps, NextPage} from "next";
import {getArticle} from "../../lib/db/article";
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

type PageProps = {
    meta?: SafeArticle,
    authorNick?: string,
    body?: string
}

const ArticleApp: NextPage<PageProps> = ({meta, body, authorNick}) => {
    const titleRef = useRef<HTMLTitleElement>(null);
    const [titleHeight, setTitleHeight] = useState(0);
    const scrolled = useScrollTrigger({threshold: titleHeight, disableHysteresis: true});
    useTitle(scrolled ? meta?.title : '文章')
    useEffect(() => {
        setTitleHeight(titleRef.current?.clientHeight ?? 0);
    }, [titleRef]);
    if (meta) {
        if (body) {
            return <>
                <Typography variant="h3" ref={titleRef}>{meta?.title}</Typography>
                <Typography variant="body2" color="text.secondary">
                    由{authorNick ?? meta.author}发布于{getHumanReadableTime(new Date(meta.postTime))}
                </Typography>
                <MarkdownScope>{body}</MarkdownScope>
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

export const getServerSideProps: GetServerSideProps<PageProps> = async (context) => {
    const {id} = context.params!;
    const meta = await getArticle(id as ArticleID);
    const stream = meta?.stream();
    const body = stream && (await readAll(stream)).toString();
    const props: PageProps = {
        meta: meta && getSafeArticle(meta),
        body
    };
    if (!meta) {
        delete props.meta;
    }
    if (!body) {
        delete props.body;
    }
    return {props}
}

export default ArticleApp;
