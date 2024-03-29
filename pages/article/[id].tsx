import { GetStaticPaths, GetStaticProps, NextPage } from 'next'
import {
    ArticleMeta,
    ArticleUtil,
    getArticle,
    getCollection,
    listArticles,
} from '../../lib/db/article'
import { getSafeArticle, SafeArticle } from '../../lib/safeArticle'
import { readAll } from '../../lib/utility'
import { serializedMdx } from '../../lib/mdxUtility'
import { Copyright } from '../../components/Copyright'
import { getUser } from '../../lib/db/user'
import Typography from '@mui/material/Typography'
import { ReactNode, useEffect, useMemo, useState } from 'react'
import { useTitle } from '../../lib/useTitle'
import { RenderingArticle } from '../../components/ArticleCard'
import { LanguageOption, useLanguage } from '../../lib/useLanguage'
import { defaultLang } from '../../lib/translation'
import { useRouter } from 'next/router'
import { getSafeComment, SafeComment } from '../../lib/safeComment'
import { getComments } from '../../lib/db/comment'
import { ReCaptchaScope } from '../../components/ReCaptchaScope'
import { ReCaptchaPolicy } from '../../components/ReCaptchaPolicy'
import { RenderingComment } from '../../components/CommentCard'

import NoArticleIcon from '@mui/icons-material/PowerOffOutlined'
import dynamic from 'next/dynamic'
import LoadingScreen from '../../components/LoadingScreen'
import { MDXRemoteSerializeResult } from 'next-mdx-remote'
import {
    getRenderingCollection,
    RenderingCollection,
} from '../../lib/renderingCollection'

const loadingView = () => <LoadingScreen />
const ArticleBody = dynamic(() => import('../../components/ArticleBody'), {
    loading: loadingView,
})
const ArticleHeader = dynamic(
    () =>
        import('../../components/ArticleHeader').then(
            (mod) => mod.ArticleHeader
        ),
    {
        loading: loadingView,
    }
)
const ArticleDescription = dynamic(
    () =>
        import('../../components/ArticleDescription').then(
            (mod) => mod.ArticleDescription
        ),
    {
        loading: loadingView,
    }
)
const PlaceHolder = dynamic(() => import('../../components/PlaceHolder'), {
    loading: loadingView,
})
const NoContentIcon = dynamic(
    () => import('@mui/icons-material/PsychologyOutlined'),
    { loading: loadingView }
)
const RevisionSection = dynamic(
    () => import('../../components/RevisionSection'),
    { loading: loadingView }
)
const CollectionSection = dynamic(
    () => import('../../components/CollectionSection'),
    { loading: loadingView }
)

type PageProps = {
    meta?: RenderingArticle
    body?: MDXRemoteSerializeResult
    comments?: RenderingComment[]
    collection?: RenderingCollection
    reCaptchaKey: string
}

type Contained = {
    collection: string
    next?: SafeArticle
    previous?: SafeArticle
}

const ArticleApp: NextPage<PageProps> = ({
    meta,
    body,
    comments,
    collection,
    reCaptchaKey,
}) => {
    useTitle({ appbar: '文章', head: meta?.title ?? '文章' })
    const router = useRouter()
    const { coll } = router.query
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
    useLanguage(langOptions)
    const [container, setContainer] = useState<Contained>()
    const [loadingContainer, setLoadingContainer] = useState(false)

    useEffect(() => {
        if (!meta || !coll) {
            setContainer(undefined)
            setLoadingContainer(false)
            return
        }
        setLoadingContainer(true)
        fetch(`/api/article/position/${coll}/${meta._id}`)
            .then((res) => res.json())
            .then((data) => setContainer(data))
            .finally(() => setLoadingContainer(false))
    }, [coll, meta])

    if (meta) {
        let content: ReactNode

        if (body) {
            content = (
                <>
                    <ArticleHeader meta={meta!} />
                    <ArticleDescription data={meta!} />
                    <ArticleBody
                        id={meta._id}
                        body={body}
                        collection={collection}
                    />
                    {container && (
                        <CollectionSection
                            loading={loadingContainer}
                            collectionTitle={container.collection}
                            collectionId={coll as string}
                            next={container.next}
                            previous={container.previous}
                        />
                    )}
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

export const getStaticProps: GetStaticProps<PageProps> = async (context) => {
    const { id } = context.params!
    const meta = await getArticle(id as ArticleID)
    const stream = meta?.stream()
    const body = stream && (await readAll(stream)).toString()
    const collection = await renderingCollection(id as ArticleID)
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
    if (collection) {
        props.collection = collection
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

async function renderingCollection(
    id: ArticleID
): Promise<RenderingCollection | undefined> {
    return await getCollection(id).then((data) =>
        data ? getRenderingCollection(data) : undefined
    )
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
