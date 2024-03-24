import { GetServerSideProps, NextPage } from 'next'
import dynamic from 'next/dynamic'
import { ArticleMeta, getArticle, getCollection } from '../../lib/db/article'
import { useTitle } from '../../lib/useTitle'
import { Dispatch, useEffect, useMemo, useState } from 'react'

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
import CollectionArrangement from '../../components/CollectionArrangement'

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

interface ConfirmationProps {
    titleModded: boolean
    forwardModded: boolean
    tagsModded: boolean
    collectionsModded: boolean
    coverModded: boolean
    bodyModded: boolean
}

function ConfirmationStepContent(props: ConfirmationProps) {
    const matrix = [
        props.titleModded,
        props.forwardModded,
        props.tagsModded,
        props.collectionsModded,
        props.coverModded,
        props.bodyModded,
    ]
    const names = ['标题', '导读', '标签', '合集', '封面', '正文']
    const moddedNames = names.filter((_, i) => matrix[i])

    return (
        <Typography>
            更改：{moddedNames.length > 0 ? moddedNames.join(' ') : '无'}
        </Typography>
    )
}

interface ContentProps extends PageProps {
    permission: Permission
}

const StorageTypes = [
    'cover',
    'title',
    'ref',
    'body',
    'tags',
    'forward',
    'collections',
    'articles',
] as const
type StorageType = (typeof StorageTypes)[number]

function PageContent(props: ContentProps): JSX.Element {
    const router = useRouter()
    const { executeRecaptcha } = useGoogleReCaptcha()

    const storageIdentifier = props.article ? props.article._id : 'new_article'
    let article: SafeArticle | undefined = props.article

    function useSaved<T>(type: StorageType, or: T): [T, Dispatch<T>, boolean] {
        const draft =
            typeof localStorage === 'object'
                ? (localStorage.getItem(getStorageId(type)) as T)
                : undefined
        const init = draft ?? or
        const [state, setState] = useState<T>(init)
        const [modified, setModified] = useState(Boolean(draft))
        useEffect(() => {
            if (typeof state === 'string') {
                saveAs(type, state)
                setModified(state != init)
            } else {
                throw 'Unsupported storage value: ' + typeof state
            }
        }, [state])
        return [state, setState, modified]
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

    function useTags(): [Tag[], Dispatch<Tag[]>, boolean] {
        let draft: Tag[] | undefined = undefined
        if (typeof localStorage === 'object') {
            const read = localStorage.getItem(getStorageId('tags'))
            if (read) {
                draft = (JSON.parse(read) as string[]).map(Tag.readTag)
            } else if (article) {
                draft = Object.entries(article.tags).map(
                    ([key, value]) => new Tag(key as TagKey, String(value))
                )
            }
        }
        const init = draft ?? []
        const [tags, setTags] = useState(init)
        const [modified, setModified] = useState(typeof draft !== 'undefined')
        useEffect(() => {
            saveAs('tags', JSON.stringify(tags.map((v) => v.toString())))
            setModified(tags != init)
        }, [tags])
        return [tags, setTags, modified]
    }

    function useAvailableCollections() {
        const storageId = getStorageId('collections')
        let selected: string[] = []
        let locallyStored = false
        if (typeof localStorage === 'object') {
            const read = localStorage.getItem(storageId)
            if (read) {
                selected = JSON.parse(read)
                locallyStored = true
            }
        }

        const [modified, setModified] = useState(locallyStored)
        const [state, setState] = useState(selected)
        const [spColl, setSpColl] = useState<SpecificCollection>()
        const [loading, setLoading] = useState(false)
        useEffect(() => {
            // load initial value
            setLoading(true)
            fetch(`/api/article/collections${article ? '/' + article._id : ''}`)
                .then((res) => res.json() as Promise<SpecificCollection>)
                .then((data) => {
                    if (!locallyStored) {
                        setState(
                            Object.entries(data)
                                .filter(([_, { containing }]) => containing)
                                .map(([id, _]) => id)
                        )
                    } else {
                        for (const id in data) {
                            data[id].containing = selected.includes(id)
                        }
                    }
                    setSpColl(data)
                })
                .finally(() => setLoading(false))
        }, [setLoading])
        useEffect(() => {
            saveAs('collections', JSON.stringify(state))
            setModified(state != selected)
        }, [state])
        return { state, setState, loading, spColl, modified }
    }

    function useContainedArticles(): [
        string[] | undefined,
        Dispatch<string[]>,
        boolean,
    ] {
        let init: ArticleID[] | undefined = undefined

        if (props.collection) {
            init = props.collection.articles.map((m) => m._id)
            const storageId = getStorageId('articles')
            if (typeof localStorage === 'object') {
                const read = localStorage.getItem(storageId)
                if (read) {
                    init = JSON.parse(read)
                }
            }
        }

        const [state, setState] = useState<ArticleID[] | undefined>(init)
        const [modified, setModified] = useState(typeof init !== 'undefined')

        useEffect(() => {
            saveAs('articles', JSON.stringify(state))
            setModified(state != init)
        }, [state])

        return [state, setState, modified]
    }

    const [title, setTitle, titleModded] = useSaved(
        'title',
        article?.title ?? ''
    )
    const [forward, setForward, forwardModded] = useSaved(
        'forward',
        article?.forward ?? ''
    )
    const [cover, setCover, coverModded] = useSaved<File | ImageID>(
        'cover',
        article?.cover ?? ''
    )
    const [value, setValue, valueModded] = useSaved('body', props.body ?? '')
    const [preload, setPreload] = useState<LocalImage>({})
    const [tags, setTags, tagsModded] = useTags()
    const {
        state: collections,
        setState: setCollections,
        loading: collLoading,
        spColl,
        modified: collectionsModded,
    } = useAvailableCollections()
    const [articles, setArticles, articlesModded] = useContainedArticles()

    function getStorageId(type: StorageType) {
        return `${storageIdentifier}.${type}`
    }

    function saveAs(type: StorageType, content: string) {
        localStorage.setItem(getStorageId(type), content)
    }

    function clear(type: StorageType) {
        localStorage.removeItem(getStorageId(type))
    }

    const [activeStep, setActiveStep] = useState(0)
    const lastStep = 2
    const stepIncrease = (i: number) => setActiveStep(activeStep + i)

    const [progress, setProgress] = useState(-1)
    const handleResult = useRequestResult(
        () => {
            StorageTypes.forEach(clear)
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
        if (articles) {
            body.articles = articles
        }
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
                        {articles && (
                            <CollectionArrangement
                                articles={articles.map(
                                    (id) =>
                                        props.collection!.articles.find(
                                            (v) => v._id == id
                                        )!
                                )}
                                onArrange={setArticles}
                            />
                        )}
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
                        <ConfirmationStepContent
                            titleModded={titleModded}
                            forwardModded={forwardModded}
                            tagsModded={tagsModded}
                            collectionsModded={collectionsModded}
                            coverModded={coverModded}
                            bodyModded={valueModded}
                        />
                        <Box mb={2} mt={2}>
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
