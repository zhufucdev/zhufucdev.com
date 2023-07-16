import {GetStaticPaths, GetStaticProps, NextPage} from "next";
import {
    ArticleMeta,
    ArticleUtil,
    getArticle,
    listArticles,
} from "../../lib/db/article";
import {getSafeArticle} from "../../lib/getSafeArticle";
import {MarkdownScope} from "../../componenets/MarkdownScope";
import {postComment, readAll} from "../../lib/utility";
import PlaceHolder from "../../componenets/PlaceHolder";
import {Copyright} from "../../componenets/Copyright";
import {getUser} from "../../lib/db/user";
import {ArticleHeader} from "../../componenets/ArticleHeader";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardActions from "@mui/material/CardActions";
import CardContent from "@mui/material/CardContent";
import Grid from "@mui/material/Grid";
import Stack from "@mui/material/Stack";
import {
    MouseEventHandler,
    ReactNode,
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react";
import {SxProps, useMediaQuery, useTheme} from "@mui/material";
import {AnimatePresence, motion} from "framer-motion";
import {useTitle} from "../../lib/useTitle";
import {ArticleDescription} from "../../componenets/ArticleDescription";
import {RenderingArticle} from "../../componenets/ArticleCard";
import {LanguageOption, useLanguage} from "../../lib/useLanguage";
import {defaultLang} from "../../lib/translation";
import {useRouter} from "next/router";
import LoginPopover from "../../componenets/LoginPopover";
import {useProfileContext} from "../../lib/useUser";
import {getSafeComment, SafeComment} from "../../lib/getSafeComment";
import {getComments} from "../../lib/db/comment";
import {hasPermission, reCaptchaNotReady} from "../../lib/contract";
import NoContentIcon from "@mui/icons-material/PsychologyOutlined";
import NoArticleIcon from "@mui/icons-material/PowerOffOutlined";
import PrIcon from "@mui/icons-material/DriveFileRenameOutline";
import CommentIcon from "@mui/icons-material/CommentOutlined";
import {ChatInputField} from "../../componenets/ChatInputField";
import {useGoogleReCaptcha} from "react-google-recaptcha-v3";
import {useRequestResult} from "../../lib/useRequestResult";
import {ReCaptchaScope} from "../../componenets/ReCaptchaScope";
import {ReCaptchaPolicy} from "../../componenets/ReCaptchaPolicy";
import {CommentCard, RenderingComment} from "../../componenets/CommentCard";
import {CommentUtil, RenderingCommentUtil} from "../../lib/comment";

type PageProps = {
    meta?: RenderingArticle;
    body?: string;
    comments?: RenderingComment[];
    reCaptchaKey: string;
};

const ArticleApp: NextPage<PageProps> = ({
        meta,
        body,
        comments,
        reCaptchaKey,
    }) => {
    useTitle({appbar: "文章", head: meta?.title ?? "文章"});
    const router = useRouter();
    const langOptions = useMemo(() => {
        if (!meta || !meta.alternatives) return undefined;
        const hrefs: LanguageOption[] = [];
        for (const key in meta.alternatives) {
            hrefs.push({name: key, href: `/article/${meta.alternatives[key]}`})
        }
        return {
            current: (meta!.tags.lang as string) ?? defaultLang,
            available: hrefs,
        }
    }, [meta]);
    const [options, ,] = useLanguage(langOptions);

    useEffect(() => {
        if (!options || !options.current) return;
        const targetId = meta!.alternatives![options.current];
        router.push(`/article/${targetId}`);
    }, [options]);

    if (meta) {
        let content: ReactNode;

        if (body) {
            content = (
                <>
                    <ArticleBody meta={meta} body={body}/>
                    <RevisionSection
                        meta={meta}
                        sx={{mt: 2}}
                        comments={comments!}
                    />
                </>
            );
        } else {
            content = (
                <>
                    <Typography variant="h3">{meta.title}</Typography>
                    <PlaceHolder
                        icon={NoContentIcon}
                        title="作者骗了你，没写正文"
                    />
                    <RevisionSection meta={meta} comments={comments!}/>
                    <ReCaptchaPolicy sx={{textAlign: "center"}}/>
                </>
            );
        }

        return (
            <ReCaptchaScope reCaptchaKey={reCaptchaKey}>
                {content}
                <ReCaptchaPolicy sx={{textAlign: "center"}}/>
                <Copyright/>
            </ReCaptchaScope>
        );
    } else {
        return <PlaceHolder icon={NoArticleIcon} title="文章未找到"/>;
    }
};

function ArticleBody({meta, body}: Omit<PageProps, "reCaptchaKey">) {
    const theme = useTheme();
    const onLargeScreen = useMediaQuery(theme.breakpoints.up("md"));
    const articleRef = useRef<HTMLDivElement>(null);

    return (
        <>
            <ArticleHeader meta={meta!} article={articleRef}/>
            <ArticleDescription data={meta!}/>
            <Box
                ref={articleRef}
                sx={{width: onLargeScreen ? "calc(100% - 240px)" : "100%"}}
            >
                <MarkdownScope>{body}</MarkdownScope>
            </Box>
        </>
    );
}

interface RevisionProps {
    meta: RenderingArticle;
    sx?: SxProps;
    comments: RenderingComment[];
}

function RevisionSection({meta, sx, comments: _comments}: RevisionProps) {
    const theme = useTheme();
    const router = useRouter();
    const {executeRecaptcha} = useGoogleReCaptcha();
    const handleCommentResult = useRequestResult((_, id) => {
        setCommenting(false);
        handleNewComment(id as string, commentBuffer);
        setCommentBuf("");
    });
    const {user} = useProfileContext();
    const [comments, setComments] = useState(_comments);
    const [reviewing, setReviewing] = useState<HTMLElement>();
    const [commenting, setCommenting] = useState(false);
    const [chatboxRevealed, setChatboxRevealed] = useState(false);
    const [postingComment, setPostingComment] = useState(false);
    const [commentBuffer, setCommentBuf] = useState("");
    const canPr = useMemo(
        () => user && hasPermission(user, "pr_article"),
        [user],
    );
    const canComment = useMemo(
        () => user && hasPermission(user, "comment"),
        [user],
    );
    const commentBufOverflow = useMemo(
        () => CommentUtil.checkLength(commentBuffer) > CommentUtil.maxLength,
        [commentBuffer],
    );
    const shouldComment = useMemo(
        () => CommentUtil.validBody(commentBuffer),
        [commentBuffer],
    );

    const handlePr: MouseEventHandler<HTMLButtonElement> = (event) => {
        setReviewing(event.currentTarget);
        if (canPr) {
            router.push(`/article/edit?id=${meta._id}`);
        }
    };
    const handleComment: MouseEventHandler<HTMLButtonElement> = (event) => {
        setReviewing(event.currentTarget);
        if (!canComment) return;
        setCommenting(!commenting);
    };

    async function handleDelete(target: RenderingComment) {
        const index = comments.findIndex((v) => v._id === target._id);
        if (index < 0) return;
        setComments(comments.slice(0, index).concat(comments.slice(index + 1)));
    }

    async function handleEdit(target: RenderingComment, newContent: string) {
        const index = comments.findIndex((v) => v._id === target._id);
        if (index < 0) return;
        setComments(
            comments
                .slice(0, index)
                .concat(
                    {...target, body: newContent, edited: true},
                    comments.slice(index + 1),
                ),
        );
    }

    function handleNewComment(id: string, body: string) {
        const comment = RenderingCommentUtil.create(
            user!,
            body,
            id,
        );
        setComments(comments.concat(comment));
    }

    async function handleCommentSubmit() {
        if (!executeRecaptcha) {
            handleCommentResult(reCaptchaNotReady);
            return;
        }

        setPostingComment(true);
        const token = await executeRecaptcha();
        const res = await postComment(
            "articles",
            meta._id,
            commentBuffer,
            token,
        );
        setCommenting(false);
        if (res.ok) {
            handleCommentResult({success: true}, await res.text());
        } else {
            let msg: string;
            switch (res.status) {
                case 500:
                    msg = "一个bug导致服务器未响应";
                    break;
                case 400:
                    msg = "人机验证失败";
                    break;
                case 403:
                    msg = "没有权限";
                    break;
                default:
                    msg = "咋回事？";
            }
            handleCommentResult({
                success: false,
                msg,
                respond: await res.text(),
            });
        }
        setPostingComment(false);
    }

    useEffect(() => {
        setTimeout(() => setChatboxRevealed(commenting), 20);
    }, [commenting]);

    const container = {
        flexGrow: 1,
        [theme.breakpoints.up("sm")]: {
            flexGrow: 1,
            flex: 1,
        },
    };
    const actions = {ml: 0.5, mt: -1, height: "64px"};

    return (
        <motion.div layout>
            <Grid
                container
                spacing={2}
                sx={{
                    ...sx,
                    flexDirection: commenting ? "column" : "row",
                }}
                component={motion.div}
                layout
            >
                <Grid item sx={container} key="comment-card">
                    <Card sx={{borderRadius: "12px"}}>
                        <CardContent>
                            <Typography variant="h5" gutterBottom>
                                你的观点
                            </Typography>
                            <Typography variant="body1">
                                留下你的评论，我是不会读的。
                            </Typography>
                        </CardContent>
                        <CardActions sx={actions}>
                            {!chatboxRevealed && (
                                <Button
                                    startIcon={<CommentIcon/>}
                                    disabled={user && !canComment}
                                    onClick={handleComment}
                                    sx={{position: "absolute"}}
                                >
                                    评论
                                </Button>
                            )}
                            <ChatInputField
                                fullWidth
                                revealingStart="left"
                                revealed={chatboxRevealed}
                                onSend={handleCommentSubmit}
                                isSending={postingComment}
                                value={commentBuffer}
                                onValueChanged={setCommentBuf}
                                sendDisabled={!shouldComment}
                                onBlur={() => {
                                    if (!commentBuffer) {
                                        setCommenting(false);
                                    }
                                }}
                                error={commentBufOverflow}
                            />
                        </CardActions>
                    </Card>
                </Grid>

                <Grid
                    item
                    key="pr-card"
                    sx={container}
                    component={motion.div}
                    variants={{
                        rest: {opacity: 1},
                        disabled: {opacity: 0.4},
                    }}
                    animate={commenting ? "disabled" : "rest"}
                >
                    <Card sx={{borderRadius: "12px"}}>
                        <CardContent>
                            <Typography variant="h5" gutterBottom>
                                拉取请求
                            </Typography>
                            <Typography variant="body1">
                                写得不咋样？你可以帮助改进这篇文章。
                            </Typography>
                        </CardContent>
                        <CardActions sx={actions}>
                            <Button
                                startIcon={<PrIcon/>}
                                disabled={(user && !canPr) || commenting}
                                onClick={handlePr}
                            >
                                发起拉取请求
                            </Button>
                        </CardActions>
                    </Card>
                </Grid>
            </Grid>

            <Stack spacing={2} mt={2}>
                <AnimatePresence initial={false}>
                    {comments.map((c) => (
                        <motion.div
                            key={c._id}
                            animate={{x: 0}}
                            exit={{x: '-120%'}}
                        >
                            <CommentCard
                                data={c}
                                onDeleted={handleDelete}
                                onEdited={handleEdit}
                            />
                        </motion.div>
                    ))}
                </AnimatePresence>
            </Stack>

            <LoginPopover
                open={Boolean(reviewing) && !user}
                onClose={() => setReviewing(undefined)}
                anchorEl={reviewing}
            />
        </motion.div>
    );
}

export const getStaticProps: GetStaticProps<PageProps> = async (context) => {
    const {id} = context.params!;
    const meta = await getArticle(id as ArticleID);
    const stream = meta?.stream();
    const body = stream && (await readAll(stream)).toString();
    const props: PageProps = {
        reCaptchaKey: process.env.RECAPTCHA_KEY_FRONTEND as string,
    };
    if (meta) {
        const user = await getUser(meta.author);
        const altLangs: { [key: string]: string } = {};
        (await ArticleUtil.languageVariants(meta)).forEach((v) => {
            altLangs[(v.tags.lang ?? defaultLang) as string] = v._id;
        });

        props.meta = {
            ...getSafeArticle(meta),
            authorNick: user?.nick,
            alternatives: altLangs,
        };
        props.comments = await renderingComments(meta);
    }
    if (body) {
        props.body = body;
    }
    return {props, revalidate: false};
};

async function renderingComments(
    meta: ArticleMeta,
): Promise<RenderingComment[]> {
    const comments: SafeComment[] = (await getComments(meta)).map(
        getSafeComment,
    );
    const rendering: RenderingComment[] = [];
    const nicknameOf: { [key: UserID]: string } = {};
    for (const comment of comments) {
        let nick: string | undefined = nicknameOf[comment.raiser];
        if (!nick) {
            nick = (await getUser(comment.raiser))?.nick;
            if (nick) nicknameOf[comment.raiser] = nick;
        }
        rendering.push({...comment, raiserNick: nick});
    }
    return rendering;
}

export const getStaticPaths: GetStaticPaths = async () => {
    const articles = await listArticles();
    return {
        paths: articles
            .filter(ArticleUtil.publicList())
            .map((meta) => ({params: {id: meta._id}})),
        fallback: "blocking",
    };
};

export default ArticleApp;
