import { GetServerSideProps, NextPage } from 'next'
import dynamic from 'next/dynamic'
import { ArticleMeta, getArticle, getCollection } from '../../lib/db/article'
import { useTitle } from '../../lib/useTitle'
import { useEffect, useMemo, useState } from 'react'

import { LocalImage } from '../../components/MarkdownScope'
import { ImagesPopover } from '../../components/ImagesPopover'
import '@uiw/react-md-editor/markdown-editor.css'
import '@uiw/react-markdown-preview/markdown.css'
import {
    Button,
    Collapse,
    IconButton,
    InputAdornment,
    LinearProgress,
    Modal,
    Stack,
    Step,
    StepContent,
    StepLabel,
    Stepper,
    TextField,
    Tooltip,
} from '@mui/material'
import Typography from '@mui/material/Typography'
import Box from '@mui/material/Box'
import { useProfileContext } from '../../lib/useUser'
import { getResponseRemark, hasPermission } from '../../lib/contract'
import { ReCaptchaScope } from '../../components/ReCaptchaScope'
import PlaceHolder from '../../components/PlaceHolder'

import PictureIcon from '@mui/icons-material/PhotoOutlined'
import LockedIcon from '@mui/icons-material/PublicOffOutlined'

import { useRequestResult } from '../../lib/useRequestResult'
import { useRouter } from 'next/router'
import { beginPost, fetchApi, readAll, uploadImage } from '../../lib/utility'
import { useGoogleReCaptcha } from 'react-google-recaptcha-v3'
import { getSafeArticle, SafeArticle } from '../../lib/safeArticle'
import TagInputField from '../../components/TagInputField'
import { Tag, TagKey } from '../../lib/tagging'
import LoadingScreen from '../../components/LoadingScreen'
import CollectionControl from '../../components/CollectionControl'
import {
    getRenderingCollection,
    RenderingCollection,
} from '../../lib/renderingCollection'
import { SpecificCollection } from '../api/article/collections/[id]'

const MdxEditor = dynamic(() => import('../../components/MdxEditor'), {
    loading: () => <LoadingScreen />,
    ssr: false,
})

type Permission = 'none' | 'create' | 'modify' | 'pr' | 'modify-pr'
const EditPage: NextPage<PageProps> = (props) => {
    useTitle(props.body ? '编辑文章' : '草拟文章')
    const { user, isLoading } = useProfileContext()
    const permission = useMemo<Permission>(() => {
        if (!isLoading) {
            if (!user) return 'none'
            if (!props.article) {
                if (hasPermission(user, 'post_article')) return 'create'
                else return 'none'
            }
            if (hasPermission(user, 'modify')) return 'modify'
            if (
                hasPermission(user, 'edit_own_post') &&
                props.article.author === user._id
            ) {
                return props.article.tags['pr-from'] ? 'modify-pr' : 'modify'
            }
            if (
                hasPermission(user, 'pr_article') &&
                props.article?.author !== user._id
            )
                return 'pr'
        }
        return 'none'
    }, [user, isLoading])

    return (
        <ReCaptchaScope reCaptchaKey={props.reCaptchaKey}>
            {permission !== 'none' ? (
                <PageContent {...props} permission={permission} />
            ) : (
                <PlaceHolder icon={LockedIcon} title="没有权限" />
            )}
        </ReCaptchaScope>
    )
}

type ButtonProps = {
    disabled?: boolean
    setter?: (stepIncremental: number) => void
    children?: string
}

function ContinueButton(props: ButtonProps): JSX.Element {
    return (
        <Button
            variant="contained"
            disabled={props.disabled === true}
            onClick={() => props.setter?.call({}, 1)}
        >
            {props.children ?? '下一步'}
        </Button>
    )
}

function BackButton(props: ButtonProps): JSX.Element {
    return (
        <Button
            variant="text"
            disabled={props.disabled === true}
            onClick={() => props.setter?.call({}, -1)}
        >
            {props.children ?? '回退'}
        </Button>
    )
}

interface MetadataProps {
    title: string
    forward: string
    cover?: File | ImageID
    tags: Tag[]
    hardcodedTags: Tag[]
    collections?: SpecificCollection
    colLoading: boolean
    context?: Partial<ArticleMeta>
    onTitleChanged: (title: string) => void
    onForwardChanged: (forward: string) => void
    onCoverChanged: (target: ImageID | File) => void
    onTagChanged: (tags: Tag[]) => void
    onCollectionsChanged: (coll: ArticleID[]) => void
    setter: (incremental: number) => void
}

function MetadataStepContent(props: MetadataProps): JSX.Element {
    const [anchor, setAnchor] = useState<HTMLElement>()

    return (
        <>
            <Stack spacing={2}>
                <Typography>如何吸引观众眼球</Typography>
                <TextField
                    label="标题"
                    value={props.title}
                    onChange={(ev) =>
                        props.onTitleChanged(ev.currentTarget.value)
                    }
                    inputMode="text"
                    variant="filled"
                    InputProps={{
                        endAdornment: (
                            <InputAdornment position="end">
                                <Tooltip title="封面">
                                    <IconButton
                                        onClick={(ev) =>
                                            setAnchor(ev.currentTarget)
                                        }
                                    >
                                        <PictureIcon />
                                    </IconButton>
                                </Tooltip>
                            </InputAdornment>
                        ),
                    }}
                />
                <TextField
                    label="导读"
                    value={props.forward}
                    onChange={(ev) =>
                        props.onForwardChanged(ev.currentTarget.value)
                    }
                    inputMode="text"
                    variant="filled"
                />

                <Typography>网站如何管理这篇文章</Typography>
                <TagInputField
                    tags={props.tags}
                    hardcoded={props.hardcodedTags}
                    context={props.context}
                    onChanged={props.onTagChanged}
                />
                <CollectionControl
                    collections={props.collections}
                    onItemsChanged={(sc) =>
                        props.onCollectionsChanged(
                            Object.entries(sc)
                                .filter(([_, { containing }]) => containing)
                                .map(([id, _]) => id)
                        )
                    }
                    loading={props.colLoading}
                />
                <Box mb={2}>
                    <BackButton disabled />
                    <ContinueButton
                        disabled={!props.title || !props.forward}
                        setter={props.setter}
                    />
                </Box>
            </Stack>
            <ImagesPopover
                open={Boolean(anchor)}
                anchorEl={anchor}
                transformOrigin={{
                    horizontal: 'right',
                    vertical: 'top',
                }}
                onSelectImage={props.onCoverChanged}
                onSelectUpload={props.onCoverChanged}
                selected={
                    typeof props.cover === 'string' ? props.cover : 'upload'
                }
                onClose={() => setAnchor(undefined)}
            />
        </>
    )
}

interface ContentProps extends PageProps {
    permission: Permission
}

function PageContent(props: ContentProps): JSX.Element {
    const router = useRouter()
    const { executeRecaptcha } = useGoogleReCaptcha()

    const storageIdentifier = props.article ? props.article._id : 'new_article'
    let article: SafeArticle | undefined = props.article

    function useSaved<T>(type: string, or: T) {
        const draft =
            typeof localStorage === 'object'
                ? (localStorage.getItem(`${storageIdentifier}.${type}`) as T)
                : undefined
        const state = useState<T>(draft ?? or)
        useEffect(() => {
            const newValue = state[0]
            if (typeof newValue === 'string') {
                saveFunc(type, newValue)
            }
        }, [state[0]])
        return state
    }

    const hardcodedTags = useMemo(() => {
        switch (props.permission) {
            case 'none':
            case 'modify':
            case 'create':
                return []
            case 'pr':
                return [
                    new Tag(TagKey.Private),
                    new Tag(TagKey.PrFrom, article!._id),
                ]
            case 'modify-pr':
                const tags = article?.tags ?? {}
                return [
                    new Tag(TagKey.Private),
                    new Tag(TagKey.PrFrom, tags['pr-from'] as string),
                ]
        }
    }, [props.permission, article])

    function useTags() {
        let draft: Tag[] | undefined = undefined
        if (typeof localStorage === 'object') {
            const read = localStorage.getItem(`${storageIdentifier}.tags`)
            if (read) {
                draft = (JSON.parse(read) as string[]).map(Tag.readTag)
            } else if (article) {
                draft = []
                for (const key in article.tags) {
                    draft.push(
                        new Tag(
                            key as TagKey,
                            (article.tags as any)[key] as any
                        )
                    )
                }
            }
        }
        const state = useState(draft ?? [])
        useEffect(() =>
            saveFunc('tags', JSON.stringify(state[0].map((v) => v.toString())))
        )
        return state
    }

    function useCollections() {
        const storageId = `${storageIdentifier}.collections`
        let collections: string[] = []
        if (typeof localStorage === 'object') {
            const read = localStorage.getItem(storageId)
            if (read) {
                collections = JSON.parse(read)
            }
        }

        const [state, setState] = useState(collections)
        const [spColl, setSpColl] = useState<SpecificCollection>()
        const [loading, setLoading] = useState(false)
        useEffect(() => {
            // load initial value
            if (localStorage.getItem(storageId)) {
                return
            }
            setLoading(true)
            fetch(`/api/article/collections${article ? '/' + article._id : ''}`)
                .then((res) => res.json() as Promise<SpecificCollection>)
                .then((data) => {
                    setSpColl(data)
                    setState(
                        Object.entries(data)
                            .filter(([_, { containing }]) => containing)
                            .map(([id, _]) => id)
                    )
                })
                .finally(() => setLoading(false))
        }, [])
        useEffect(() => {
            // save to localStorage
            saveFunc('collections', JSON.stringify(state))
        }, [state])
        return { state, setState, loading, spColl }
    }

    const [title, setTitle] = useSaved('title', article?.title ?? '')
    const [forward, setForward] = useSaved('forward', article?.forward ?? '')
    const [cover, setCover] = useSaved<File | ImageID>(
        'cover',
        article?.cover ?? ''
    )
    const [value, setValue] = useSaved('body', props.body ?? '')
    const [preload, setPreload] = useState<LocalImage>({})
    const [tags, setTags] = useTags()
    const {
        state: collections,
        setState: setCollections,
        loading: collLoading,
        spColl,
    } = useCollections()

    function saveFunc(type: string, content: string): () => void {
        const id = storageIdentifier
        return () => {
            localStorage.setItem(`${id}.${type}`, content)
        }
    }

    const [activeStep, setActiveStep] = useState(0)
    const lastStep = 2
    const stepIncrease = (i: number) => setActiveStep(activeStep + i)

    const [progress, setProgress] = useState(-1)
    const handleResult = useRequestResult(
        () => {
            ;['cover', 'title', 'ref', 'body', 'tags'].forEach((v) =>
                localStorage.removeItem(`${storageIdentifier}.${v}`)
            )
            router.push('/article')
        },
        () => {
            setProgress(-1)
            setActiveStep(lastStep)
        }
    )

    async function handleSubmit() {
        setProgress(0)
        if (!title || !forward || !value || !executeRecaptcha) {
            handleResult({ success: false, msg: 'bug' })
            return
        }

        const ref = article ? article._id : await beginPost('articles')
        const { source, cover, stop } = await presubmit(ref)
        if (stop) return

        const token = await executeRecaptcha()
        let body: any = {
            ref,
            title,
            forward,
            token,
            cover,
            body: source,
            tags: tags.concat(hardcodedTags).map((t) => t.toString()),
            collections,
        }
        let res: Response
        if (article) {
            const original = article
            body.id = original._id
            if (body.title === original.title) {
                delete body.title
            }
            if (body.forward === original.forward) {
                delete body.forward
            }
            if (body.cover === original.cover || !body.cover) {
                delete body.cover
            }
            if (source === props.body) {
                delete body.body
            }
            res = await fetchApi('/api/article/edit', body)
        } else {
            res = await fetchApi(`/api/article/create`, body)
        }

        handleResult(await getResponseRemark(res))
    }

    /**
     * Preceding steps of article uploading, which is basically image uploading
     * @param ref id to the article
     * @return some object containing the refactored passage body
     */
    async function presubmit(
        ref: string
    ): Promise<{ source: string; cover?: string; stop?: boolean }> {
        let coverId: string | undefined = article?.cover
        const preloadKeys = Object.getOwnPropertyNames(preload)
        const stepCount = preloadKeys.length + 1
        if (typeof cover === 'string') {
            coverId = cover
        } else if (cover) {
            // upload new cover
            const token = await executeRecaptcha!()
            const res = await uploadImage(cover as File, token, 'cover', [ref])
            const remark = await getResponseRemark(res)
            if (!remark.success) {
                handleResult(remark)
                return {
                    source: '',
                    stop: true,
                }
            }
            coverId = await res.text()
        }
        setProgress((1 / stepCount) * 100)

        let source = value!
        for (let i = 0; i < preloadKeys.length; i++) {
            const key = preloadKeys[i]
            const image = preload[key]
            const token = await executeRecaptcha!()
            const res = await uploadImage(image, token, 'post', [ref])
            const remark = await getResponseRemark(res)
            if (!remark.success) {
                // upload failure
                handleResult(remark)
                return {
                    source: '',
                    stop: true,
                }
            }

            const imageId = await res.text()
            source = source.replaceAll(key, imageId)

            setProgress(((i + 2) / stepCount) * 100)
        }

        return {
            cover: coverId,
            source,
        }
    }

    useEffect(() => {
        if (activeStep > lastStep) {
            handleSubmit()
        }
    }, [activeStep])

    return (
        <>
            <Modal open={progress >= 0} sx={{ transitionDelay: '400ms' }}>
                <LinearProgress
                    variant={progress > 0 ? 'determinate' : 'indeterminate'}
                    value={progress}
                />
            </Modal>
            <Stepper activeStep={activeStep} orientation="vertical">
                <Step key="metadata">
                    <StepLabel
                        optional={
                            title &&
                            forward && (
                                <Collapse in={activeStep > 0}>
                                    <Stack>
                                        <Typography variant="caption">
                                            标题：{title}
                                        </Typography>
                                        <Typography variant="caption">
                                            导读：{forward}
                                        </Typography>
                                    </Stack>
                                </Collapse>
                            )
                        }
                    >
                        元数据
                    </StepLabel>
                    <StepContent>
                        <MetadataStepContent
                            setter={stepIncrease}
                            title={title}
                            onTitleChanged={setTitle}
                            forward={forward}
                            onForwardChanged={setForward}
                            cover={cover}
                            onCoverChanged={setCover}
                            tags={tags}
                            hardcodedTags={hardcodedTags}
                            onTagChanged={setTags}
                            context={{ ...article, postTime: undefined }}
                            collections={spColl}
                            colLoading={collLoading}
                            onCollectionsChanged={setCollections}
                        />
                    </StepContent>
                </Step>
                <Step key="content">
                    <StepLabel
                        optional={
                            <Typography variant="caption">
                                {value?.length ?? 0}字符
                            </Typography>
                        }
                    >
                        内容
                    </StepLabel>
                    <StepContent>
                        <MdxEditor
                            value={value}
                            onChange={setValue}
                            preload={preload}
                            collection={props.collection}
                            onUploadImage={(key, file) => {
                                const nextPreupload = preload
                                preload[key] = file
                                setPreload(nextPreupload)
                            }}
                        />
                        <Box mb={2} mt={2}>
                            <BackButton setter={stepIncrease} />
                            <ContinueButton setter={stepIncrease} />
                        </Box>
                    </StepContent>
                </Step>
                <Step key="confirmation">
                    <StepLabel
                        optional={
                            <Typography variant="caption">最后一步</Typography>
                        }
                    >
                        确认
                    </StepLabel>
                    <StepContent>
                        <Box mb={2}>
                            <BackButton setter={stepIncrease} />
                            <ContinueButton setter={stepIncrease}>
                                提交
                            </ContinueButton>
                        </Box>
                    </StepContent>
                </Step>
            </Stepper>
        </>
    )
}

type PageProps = {
    article?: SafeArticle
    collection?: RenderingCollection
    body?: string
    reCaptchaKey: string
}
export const getServerSideProps: GetServerSideProps<PageProps> = async (
    context
) => {
    const { id } = context.query
    const reCaptchaKey = process.env.RECAPTCHA_KEY_FRONTEND as string
    if (id) {
        const article = await getArticle(id as string)
        const collection = await getCollection(id as string).then((data) =>
            data ? getRenderingCollection(data) : undefined
        )
        if (article) {
            const props: PageProps = {
                article: getSafeArticle(article),
                body: (await readAll(article.stream())).toString(),
                reCaptchaKey,
            }
            if (collection) {
                props.collection = collection
            }
            return {
                props,
            }
        } else {
            return {
                props: { reCaptchaKey },
                redirect: {
                    permanent: false,
                    destination: '/article/edit',
                },
            }
        }
    }
    return { props: { reCaptchaKey } }
}

export default EditPage
