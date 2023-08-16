import { GetStaticPaths, GetStaticProps, NextPage } from 'next'
import {
    ArticleMeta,
    ArticleUtil,
    getArticle,
    listArticles,
} from '../../lib/db/article'
import { getSafeArticle } from '../../lib/getSafeArticle'
import { readAll } from '../../lib/utility'
import { serializedMdx } from '../../lib/mdxUtility'
import { Copyright } from '../../components/Copyright'
import { getUser } from '../../lib/db/user'
import Typography from '@mui/material/Typography'
import Box from '@mui/material/Box'
import Grid from '@mui/material/Grid'
import Stack from '@mui/material/Stack'
import { ReactNode, useEffect, useMemo, useRef, useState } from 'react'
import { SxProps, useMediaQuery, useTheme } from '@mui/material'
import { AnimatePresence, motion } from 'framer-motion'
import { useTitle } from '../../lib/useTitle'
import { RenderingArticle } from '../../components/ArticleCard'
import { LanguageOption, useLanguage } from '../../lib/useLanguage'
import { defaultLang } from '../../lib/translation'
import { useRouter } from 'next/router'
import { useProfileContext } from '../../lib/useUser'
import { getSafeComment, SafeComment } from '../../lib/getSafeComment'
import { getComments } from '../../lib/db/comment'
import { ReCaptchaScope } from '../../components/ReCaptchaScope'
import { ReCaptchaPolicy } from '../../components/ReCaptchaPolicy'
import { RenderingComment } from '../../components/CommentCard'

import NoArticleIcon from '@mui/icons-material/PowerOffOutlined'
import dynamic from 'next/dynamic'
import LoadingScreen from '../../components/LoadingScreen'
import { MDXRemoteSerializeResult } from 'next-mdx-remote'

const loadingView = () => <LoadingScreen />
const LoginPopover = dynamic(() => import('../../components/LoginPopover'))
const ArticleComment = dynamic(
    () => import('../../components/ArticleComment'),
    { loading: loadingView }
)
const ArticlePr = dynamic(() => import('../../components/ArticlePr'), {
    loading: loadingView,
})
const CommentCard = dynamic(
    () => import('../../components/CommentCard').then((mod) => mod.CommentCard),
    { loading: loadingView }
)
const ArticleHeader = dynamic(
    () =>
        import('../../components/ArticleHeader').then(
            (mod) => mod.ArticleHeader
        ),
    { loading: loadingView }
)
const ArticleDescription = dynamic(
    () =>
        import('../../components/ArticleDescription').then(
            (mod) => mod.ArticleDescription
        ),
    { loading: loadingView }
)
const MarkdownScope = dynamic(
    () =>
        import('../../components/MarkdownScope').then(
            (mod) => mod.MarkdownScope
        ),
    { loading: loadingView }
)
const PlaceHolder = dynamic(() => import('../../components/PlaceHolder'), {
    loading: loadingView,
})
const NoContentIcon = dynamic(
    () => import('@mui/icons-material/PsychologyOutlined'),
    { loading: loadingView }
)

type PageProps = {
    meta?: RenderingArticle
    body?: MDXRemoteSerializeResult
    comments?: RenderingComment[]
    reCaptchaKey: string
}

const ArticleApp: NextPage<PageProps> = ({
    meta,
    body,
    comments,
    reCaptchaKey,
}) => {
    useTitle({ appbar: '文章', head: meta?.title ?? '文章' })
    const router = useRouter()
    const langOptions = useMemo(() => {
        if (!meta || !meta.alternatives) return undefined
        const hrefs: LanguageOption[] = []
        for (const key in meta.alternatives) {
            hrefs.push({
                name: key,
                href: `/article/${meta.alternatives[key]}`,
            })
        }
        return {
            current: (meta!.tags.lang as string) ?? defaultLang,
            available: hrefs,
        }
    }, [meta])
    const [options] = useLanguage(langOptions)

    useEffect(() => {
        if (!options || !options.current) return
        const targetId = meta!.alternatives![options.current]
        router.push(`/article/${targetId}`)
    }, [options])

    if (meta) {
        let content: ReactNode

        if (body) {
            content = (
                <>
                    <ArticleBody meta={meta} body={body} />
                    <RevisionSection
                        meta={meta}
                        sx={{ mt: 2 }}
                        comments={comments!}
                    />
                </>
            )
        } else {
            content = (
                <>
                    <Typography variant="h3">{meta.title}</Typography>
                    <PlaceHolder
                        icon={NoContentIcon}
                        title="作者骗了你，没写正文"
                    />
                    <RevisionSection meta={meta} comments={comments!} />
                    <ReCaptchaPolicy sx={{ textAlign: 'center' }} />
                </>
            )
        }

        return (
            <ReCaptchaScope reCaptchaKey={reCaptchaKey}>
                {content}
                <ReCaptchaPolicy sx={{ textAlign: 'center' }} />
                <Copyright />
            </ReCaptchaScope>
        )
    } else {
        return <PlaceHolder icon={NoArticleIcon} title="文章未找到" />
    }
}

function ArticleBody({ meta, body }: Omit<PageProps, 'reCaptchaKey'>) {
    const theme = useTheme()
    const onLargeScreen = useMediaQuery(theme.breakpoints.up('md'))
    const articleRef = useRef<HTMLDivElement>(null)

    return (
        <>
            <ArticleHeader meta={meta!} article={articleRef} />
            <ArticleDescription data={meta!} />
            <Box
                ref={articleRef}
                sx={{ width: onLargeScreen ? 'calc(100% - 240px)' : '100%' }}
            >
                <MarkdownScope lazy>{body!}</MarkdownScope>
            </Box>
        </>
    )
}

interface RevisionProps {
    meta: RenderingArticle
    sx?: SxProps
    comments: RenderingComment[]
}

function RevisionSection({ meta, sx, comments: _comments }: RevisionProps) {
    const theme = useTheme()
    const { user } = useProfileContext()
    const [comments, setComments] = useState(_comments)
    const [reviewing, setReviewing] = useState<HTMLElement>()
    const [commenting, setCommenting] = useState(false)

    async function handleDelete(target: RenderingComment) {
        const index = comments.findIndex((v) => v._id === target._id)
        if (index < 0) return
        setComments(comments.slice(0, index).concat(comments.slice(index + 1)))
    }

    async function handleEdit(target: RenderingComment, newContent: string) {
        const index = comments.findIndex((v) => v._id === target._id)
        if (index < 0) return
        setComments(
            comments
                .slice(0, index)
                .concat(
                    { ...target, body: newContent, edited: true },
                    comments.slice(index + 1)
                )
        )
    }

    const container = {
        flexGrow: 1,
        [theme.breakpoints.up('sm')]: {
            flexGrow: 1,
            flex: 1,
        },
    }

    return (
        <motion.div layout>
            <Grid
                container
                spacing={2}
                sx={{
                    ...sx,
                    flexDirection: commenting ? 'column' : 'row',
                }}
                component={motion.div}
                layout
            >
                <Grid item sx={container} key="comment-card">
                    <ArticleComment
                        expanded={commenting}
                        setExpanded={setCommenting}
                        articleId={meta._id}
                        postComment={(c) => setComments(comments.concat(c))}
                        setPrimaryButton={setReviewing}
                    />
                </Grid>

                <Grid
                    item
                    key="pr-card"
                    sx={container}
                    component={motion.div}
                    variants={{
                        rest: { opacity: 1 },
                        disabled: { opacity: 0.4 },
                    }}
                    animate={commenting ? 'disabled' : 'rest'}
                >
                    <ArticlePr
                        commenting={commenting}
                        articleId={meta._id}
                        setPrimaryButton={setReviewing}
                    />
                </Grid>
            </Grid>

            <Stack spacing={2} mt={2}>
                <AnimatePresence initial={false}>
                    {comments.map((c) => (
                        <motion.div
                            key={c._id}
                            animate={{ x: 0 }}
                            exit={{ x: '-120%' }}
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
    )
}

export const getStaticProps: GetStaticProps<PageProps> = async (context) => {
    const { id } = context.params!
    const meta = await getArticle(id as ArticleID)
    const stream = meta?.stream()
    const body = stream && (await readAll(stream)).toString()
    const props: PageProps = {
        reCaptchaKey: process.env.RECAPTCHA_KEY_FRONTEND as string,
    }
    if (meta) {
        const user = await getUser(meta.author)
        const altLangs: { [key: string]: string } = {}
        ;(await ArticleUtil.languageVariants(meta)).forEach((v) => {
            altLangs[(v.tags.lang ?? defaultLang) as string] = v._id
        })

        props.meta = {
            ...getSafeArticle(meta),
            authorNick: user?.nick,
            alternatives: altLangs,
        }
        props.comments = await renderingComments(meta)
    }
    if (body) {
        props.body = await serializedMdx(body)
    }
    return { props, revalidate: false }
}

async function renderingComments(
    meta: ArticleMeta
): Promise<RenderingComment[]> {
    const comments: SafeComment[] = (await getComments(meta)).map(
        getSafeComment
    )
    const rendering: RenderingComment[] = []
    const nicknameOf: { [key: UserID]: string } = {}
    for (const comment of comments) {
        let nick: string | undefined = nicknameOf[comment.raiser]
        if (!nick) {
            nick = (await getUser(comment.raiser))?.nick
            if (nick) nicknameOf[comment.raiser] = nick
        }
        rendering.push({ ...comment, raiserNick: nick })
    }
    return rendering
}

export const getStaticPaths: GetStaticPaths = async () => {
    const articles = await listArticles()
    return {
        paths: articles
            .filter(ArticleUtil.publicList())
            .map((meta) => ({ params: { id: meta._id } })),
        fallback: 'blocking',
    }
}

export default ArticleApp
