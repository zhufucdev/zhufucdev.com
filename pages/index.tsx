import type { NextPage } from 'next'
import { useState } from 'react'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Grid from '@mui/material/Grid'
import Stack from '@mui/material/Stack'
import useMediaQuery from '@mui/material/useMediaQuery'
import { useTheme } from '@mui/material'
import { AnimatePresence, motion } from 'framer-motion'

import NoRecentsIcon from '@mui/icons-material/WifiTetheringOffOutlined'
import BulbIcon from '@mui/icons-material/LightbulbOutlined'
import NoArticleIcon from '@mui/icons-material/PsychologyOutlined'
import EditIcon from '@mui/icons-material/Edit'
import ContinueIcon from '@mui/icons-material/ArrowForward'

import { getRecents, Recent } from '../lib/db/recent'
import { getInspirations } from '../lib/db/inspiration'
import PlaceHolder from '../components/PlaceHolder'
import { Copyright } from '../components/Copyright'
import { Scaffold } from '../components/Scaffold'
import { DraftDialog } from '../components/DraftDialog'
import { RenderingInspiration } from '../components/InspirationCard'
import { useTitle } from '../lib/useTitle'
import { getUser, getUsers, User } from '../lib/db/user'
import { ReCaptchaScope } from '../components/ReCaptchaScope'
import { ReCaptchaPolicy } from '../components/ReCaptchaPolicy'
import Link from 'next/link'
import { ArticleUtil, listArticles } from '../lib/db/article'
import { getSafeArticle } from '../lib/getSafeArticle'
import { RenderingArticle } from '../components/ArticleCard'
import { HorizontallyScrollingStack } from '../components/HorizontallyScrollingStack'
import { myId } from '../lib/useUser'
import { Caption } from '../components/Caption'
import dynamic from 'next/dynamic'
import LoadingScreen from '../components/LoadingScreen'

const loadingView = () => <LoadingScreen />

const RecentCard = dynamic(
    () => import('../components/RecentCard').then((v) => v.RecentCard),
    {
        loading: loadingView,
        ssr: false,
    }
)

const InspirationCard = dynamic(
    () =>
        import('../components/InspirationCard').then((v) => v.InspirationCard),
    {
        loading: loadingView,
        ssr: false,
    }
)

const ArticleCard = dynamic(
    () => import('../components/ArticleCard').then((v) => v.ArticleCard),
    {
        loading: loadingView,
        ssr: false,
    }
)

const Home: NextPage<PageProps> = ({
    recents,
    inspirations: _inspirations,
    articles,
    recaptchaKey,
    myName,
}) => {
    const [draftOpen, setDraft] = useState(false)
    useTitle({ appbar: '主页', head: `${myName}的博客` })

    const [inspirations, setInspirations] = useState(_inspirations)

    function handleNewPost(
        type: MessageType,
        id: string,
        raiser: User,
        content: MessageContent
    ) {
        switch (type) {
            case 'inspiration':
                inspirations.unshift({
                    _id: id,
                    raiser: raiser._id,
                    body: content.body,
                    likes: [],
                    flag: 'none',
                    archived: false,
                    comments: [],
                    raiserNick: raiser.nick,
                })
                setInspirations(inspirations)
                break
            case 'recent':
                recents.pop()
                recents.unshift({
                    _id: id,
                    body: content.body,
                    title: content.title!,
                    cover: content.image!,
                    time: new Date().toISOString(),
                    likes: [],
                    dislikes: [],
                })
        }
    }

    return (
        <ReCaptchaScope reCaptchaKey={recaptchaKey}>
            <Scaffold
                spacing={2}
                fabContent={
                    <>
                        <EditIcon sx={{ mr: 1 }} />
                        草拟
                    </>
                }
                onFabClick={() => setDraft(true)}
            >
                <RecentCards key="recents" data={recents} />
                <ArticleCards key="articles" data={articles} />
                <InspirationCards
                    key="inspirations"
                    data={inspirations}
                    setData={setInspirations}
                />
            </Scaffold>
            <DraftDialog
                open={draftOpen}
                onClose={() => setDraft(false)}
                onPosted={handleNewPost}
            />
            <ReCaptchaPolicy sx={{ textAlign: 'center' }} />
            <Copyright />
        </ReCaptchaScope>
    )
}

export type LocalRecent = Omit<Recent, 'time'> & {
    time: string
}

function RecentCards(props: { data: LocalRecent[] }): JSX.Element {
    const { data } = props
    const theme = useTheme()
    const onLargeScreen = useMediaQuery(theme.breakpoints.up('md'))

    const subtitle = <Caption key="subtitle-recents">近况</Caption>

    const [more, setMore] = useState(false)

    function handleShowMoreClick() {
        setMore(true)
    }

    if (data.length > 1) {
        return (
            <Box>
                {subtitle}
                <Grid
                    container
                    spacing={2}
                    sx={{ display: { md: 'flex', sm: 'block', xs: 'block' } }}
                >
                    {data.map((e, i) =>
                        i == 0 ? (
                            <Grid item sx={{ flex: 1 }} key={e._id}>
                                <RecentCard data={e} />
                            </Grid>
                        ) : onLargeScreen ? (
                            <Grid item sx={{ flex: 1 }} key={e._id}>
                                <RecentCard data={e} />
                            </Grid>
                        ) : (
                            <Grid
                                item
                                sx={{ flex: 1 }}
                                component={motion.div}
                                key={e._id}
                                variants={{
                                    shown: {
                                        y: 0,
                                        opacity: 1,
                                        display: 'block',
                                    },
                                    hidden: {
                                        y: -10,
                                        opacity: 0,
                                        display: 'none',
                                    },
                                }}
                                animate={more ? 'shown' : 'hidden'}
                                transition={{
                                    ease: 'easeInOut',
                                    duration: 0.2,
                                }}
                            >
                                <RecentCard data={e} />
                            </Grid>
                        )
                    )}
                </Grid>
                <Box
                    sx={{
                        display: { md: 'none', sm: 'flex', xs: 'flex' },
                        flexDirection: 'row-reverse',
                        mt: 1,
                    }}
                    component={motion.div}
                    variants={{
                        shown: { opacity: 1 },
                        hidden: { opacity: 0, display: 'none' },
                    }}
                    animate={more ? 'hidden' : 'shown'}
                    transition={{ duration: 0.2 }}
                >
                    <Button variant="text" onClick={handleShowMoreClick}>
                        更多
                    </Button>
                </Box>
            </Box>
        )
    }
    if (data.length > 0) {
        return <RecentCard data={data[0]} />
    } else {
        return (
            <Box>
                {subtitle}
                <PlaceHolder icon={NoRecentsIcon} title="未更新近况" />
            </Box>
        )
    }
}

function InspirationCards(props: {
    data: RenderingInspiration[]
    setData: (value: RenderingInspiration[]) => void
}): JSX.Element {
    const { data, setData } = props

    if (data.length > 0) {
        return (
            <Stack
                spacing={1}
                component={motion.div}
                layout
                sx={{ overflowX: 'hidden' }}
            >
                <Caption key="subtitle-inspirations">灵感</Caption>
                <AnimatePresence initial={false}>
                    {data.map((e) => (
                        <motion.div
                            key={e._id}
                            animate={{ x: 0 }}
                            exit={{ x: '100%', height: 0 }}
                        >
                            <InspirationCard
                                data={e}
                                onDeleted={() =>
                                    setData(
                                        data.filter((en) => en._id !== e._id)
                                    )
                                }
                                onArchiveChanged={(archived) =>
                                    archived &&
                                    setData(
                                        data.filter((en) => en._id !== e._id)
                                    )
                                }
                            />
                        </motion.div>
                    ))}
                </AnimatePresence>
                <Box display="flex" flexDirection="row-reverse">
                    <Button variant="text" component={Link} href="/inspiration">
                        所有灵感 <ContinueIcon />
                    </Button>
                </Box>
            </Stack>
        )
    } else {
        return (
            <Box>
                <Caption key="subtitle-inspirations">灵感</Caption>
                <PlaceHolder icon={BulbIcon} title="未提供灵感" />
            </Box>
        )
    }
}

function ArticleCards(props: { data: RenderingArticle[] }) {
    const { data } = props
    if (data.length > 0) {
        return (
            <>
                <Caption key="subtitle-articles">文章</Caption>
                <HorizontallyScrollingStack
                    spacing={1}
                    direction="row"
                    sx={{ overflowX: 'auto' }}
                >
                    {data.map((v) => (
                        <ArticleCard
                            data={v}
                            key={v._id}
                            sx={{ minWidth: 250 }}
                        />
                    ))}
                </HorizontallyScrollingStack>
            </>
        )
    } else {
        return (
            <Box>
                <Caption key="subtitle-inspirations">文章</Caption>
                <PlaceHolder icon={NoArticleIcon} title="未更新文章" />
            </Box>
        )
    }
}

type PageProps = {
    recents: LocalRecent[]
    inspirations: RenderingInspiration[]
    articles: RenderingArticle[]
    recaptchaKey: string
    myName: string
}

type StaticProps = {
    props: PageProps
    revalidate: number | boolean
}

export async function getStaticProps(): Promise<StaticProps> {
    const recents = (await getRecents()).map((v) => ({
        ...v,
        time: v.time.toISOString(),
    }))
    const inspirations = await getInspirations()
    const articles = (await listArticles())
        .filter(ArticleUtil.publicList())
        .slice(0, 3)
        .map(getSafeArticle)
    const unfoldedInspirations: RenderingInspiration[] = []
    const unfoldedArticles: RenderingArticle[] = []
    const authors = inspirations
        .map((m) => m.raiser)
        .concat(articles.map((v) => v.author))
    const author = await getUsers(authors)
    const me = await getUser(myId)
    for (const meta of inspirations) {
        if (meta.archived) continue
        const user = author(meta.raiser)
        if (user)
            unfoldedInspirations.push({
                ...meta,
                raiserNick: user.nick,
            })
        else unfoldedInspirations.push(meta)
    }
    for (const meta of articles) {
        const user = author(meta.author)
        if (user) {
            unfoldedArticles.push({
                ...meta,
                authorNick: user.nick,
                alternatives: {},
            })
        } else {
            unfoldedArticles.push(meta)
        }
    }
    return {
        props: {
            recents,
            inspirations: unfoldedInspirations,
            articles: unfoldedArticles,
            recaptchaKey: process.env.RECAPTCHA_KEY_FRONTEND as string,
            myName: me!.nick,
        },
        revalidate: false,
    }
}

export default Home
