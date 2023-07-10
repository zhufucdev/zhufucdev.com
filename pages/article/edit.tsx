import {GetServerSideProps, NextPage} from "next";
import dynamic from "next/dynamic";
import {getArticle} from "../../lib/db/article";
import {useTitle} from "../../lib/useTitle";
import {useEffect, useMemo, useRef, useState} from "react";

import {LocalCache, LocalImage, MarkdownScope} from "../../componenets/MarkdownScope";
import {ImagesPopover} from "../../componenets/ImagesPopover";
import "@uiw/react-md-editor/markdown-editor.css";
import "@uiw/react-markdown-preview/markdown.css";
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
    Tooltip
} from "@mui/material";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import {useProfileContext} from "../../lib/useUser";
import {getResponseRemark, hasPermission} from "../../lib/contract";
import {ReCaptchaScope} from "../../componenets/ReCaptchaScope";
import PlaceHolder from "../../componenets/PlaceHolder";

import PictureIcon from "@mui/icons-material/PhotoOutlined";
import LockedIcon from "@mui/icons-material/PublicOffOutlined";
import UploadIcon from "@mui/icons-material/UploadOutlined";

import {useRequestResult} from "../../lib/useRequestResult";
import {useRouter} from "next/router";
import {beginPost, fetchApi, readAll, uploadImage} from "../../lib/utility";
import {useGoogleReCaptcha} from "react-google-recaptcha-v3";
import {getSafeArticle, SafeArticle} from "../../lib/getSafeArticle";
import {ICommand} from "@uiw/react-md-editor";
import * as commands from "@uiw/react-md-editor/lib/commands";
import {nanoid} from "nanoid";
import TagInputField from "../../componenets/TagInputField";
import {readTags, Tag, TagKey} from "../../lib/tagging";

const MDEditor = dynamic(
    () => import("@uiw/react-md-editor"),
    {ssr: false}
);

type Permission = 'none' | 'create' | 'modify' | 'pr' | 'modify-pr';
const EditPage: NextPage<PageProps> = (props) => {
    useTitle(props.body ? '编辑文章' : '草拟文章');
    const {user, isLoading} = useProfileContext();
    const permission = useMemo<Permission>(() => {
        if (!isLoading) {
            if (!user) return 'none';
            if (!props.article) {
                if (hasPermission(user, 'post_article')) return 'create';
                else return 'none';
            }
            if (hasPermission(user, 'modify')) return 'modify';
            if (hasPermission(user, 'edit_own_post') && props.article.author === user._id) {
                const tags = readTags(props.article);
                return tags["pr-from"] ? 'modify-pr' : 'modify';
            }
            if (hasPermission(user, 'pr_article') && props.article?.author !== user._id) return 'pr';
        }
        return 'none'
    }, [user, isLoading]);

    return <ReCaptchaScope reCaptchaKey={props.reCaptchaKey}>
        {
            permission !== 'none' ?
                <PageContent {...props} permission={permission}/>
                : <PlaceHolder icon={LockedIcon} title="做得好，下次别做了"/>
        }
    </ReCaptchaScope>
}

type ButtonProps = { disabled?: boolean, setter?: (stepIncremental: number) => void, children?: string }

function ContinueButton(props: ButtonProps): JSX.Element {
    return (
        <Button
            variant="contained"
            disabled={props.disabled === true}
            onClick={() => props.setter?.call({}, 1)}>{props.children ?? "下一步"}</Button>
    )
}

function BackButton(props: ButtonProps): JSX.Element {
    return (
        <Button
            variant="text"
            disabled={props.disabled === true}
            onClick={() => props.setter?.call({}, -1)}>{props.children ?? "回退"}</Button>
    )
}

interface MetadataProps {
    title: string,
    forward: string,
    cover?: File | ImageID,
    tags: Tag[],
    hardcodedTags: Tag[],
    onTitleChanged: (title: string) => void,
    onForwardChanged: (forward: string) => void,
    onCoverChanged: (target: ImageID | File) => void,
    onTagChanged: (tags: Tag[]) => void,
    setter: (incremental: number) => void
}

function MetadataStepContent(props: MetadataProps): JSX.Element {
    const [anchor, setAnchor] = useState<HTMLElement>();

    return <>
        <Stack spacing={2}>
            <Typography>如何吸引观众眼球</Typography>
            <TextField
                label="标题"
                value={props.title}
                onChange={ev => props.onTitleChanged(ev.currentTarget.value)}
                inputMode="text"
                variant="filled"
                InputProps={{
                    endAdornment:
                        <InputAdornment position="end">
                            <Tooltip title="封面">
                                <IconButton onClick={(ev) => setAnchor(ev.currentTarget)}>
                                    <PictureIcon/>
                                </IconButton>
                            </Tooltip>
                        </InputAdornment>
                }}
            />
            <TextField
                label="导读"
                value={props.forward}
                onChange={ev => props.onForwardChanged(ev.currentTarget.value)}
                inputMode="text"
                variant="filled"/>

            <Typography>网站如何管理这篇文章</Typography>
            <TagInputField tags={props.tags} hardcoded={props.hardcodedTags} onChanged={props.onTagChanged}/>
            <Box mb={2}>
                <BackButton disabled/>
                <ContinueButton disabled={!props.title || !props.forward} setter={props.setter}/>
            </Box>
        </Stack>
        <ImagesPopover
            open={Boolean(anchor)}
            anchorEl={anchor}
            transformOrigin={{
                horizontal: "right",
                vertical: "top"
            }}
            onSelectImage={props.onCoverChanged}
            onSelectUpload={props.onCoverChanged}
            selected={typeof props.cover === 'string' ? props.cover : 'upload'}
            onClose={() => setAnchor(undefined)}
            filter={meta => meta.use === 'save'}
        />
    </>
}

type EditorProps = {
    value: string | undefined,
    preload: LocalImage,
    onChange: (value: string) => void,
    onUploadImage: (key: string, image: File) => void
}

function MyEditor({value, preload, onChange, onUploadImage}: EditorProps): JSX.Element {
    const [imageCache, setImageCache] = useState<LocalCache>({});
    const uploadRef = useRef<HTMLInputElement>(null);

    const uploadImage: ICommand = {
        name: 'upload image',
        keyCommand: 'upload',
        buttonProps: {'aria-label': '上传图片'},
        icon: <UploadIcon sx={{fontSize: 16}}/>,
        execute: (state, api) => {
            if (!uploadRef.current) return;

            uploadRef.current.click();
            const changeListener = () => {
                const file = uploadRef.current!.files?.item(0);
                if (!file) return;
                const id = nanoid();
                onUploadImage(id, file);

                if (state.selectedText) {
                    api.replaceSelection(id);
                } else {
                    api.replaceSelection(`![image-${Object.getOwnPropertyNames(preload).length}](${id})`)
                }
            };
            uploadRef.current.addEventListener('change', changeListener, {once: true});
            uploadRef.current.addEventListener('cancel', (ev) => {
                ev.currentTarget!.removeEventListener('change', changeListener);
            })
        },
    };

    function handleNewCache(key: string, cache: string) {
        const nextCache = imageCache;
        nextCache[key] = cache;
        setImageCache(nextCache);
    }

    const preview =
        <MarkdownScope
            preload={preload}
            imageCache={imageCache}
            newCache={handleNewCache}>
            {value}
        </MarkdownScope>;

    return (
        <>
            <MDEditor
                value={value}
                onChange={v => onChange(v ?? '')}
                components={{preview: () => preview}}
                commands={commands.getCommands()}
                extraCommands={[uploadImage, commands.divider, ...commands.getExtraCommands()]}
            />
            <input hidden type="file" accept="image/*" ref={uploadRef}/>
        </>
    )
}

interface ContentProps extends PageProps {
    permission: Permission
}

function PageContent(props: ContentProps): JSX.Element {
    const router = useRouter();
    const {executeRecaptcha} = useGoogleReCaptcha();

    const storageIdentifier = props.article ? props.article._id : "new_article";
    let article: SafeArticle | undefined = props.article;

    function useSaved<T>(type: string, or: T) {
        const draft =
            typeof localStorage === 'object'
                ? localStorage.getItem(`${storageIdentifier}.${type}`) as T
                : undefined;
        return useState<T>(draft ?? or);
    }

    const hardcodedTags = useMemo(() => {
        switch (props.permission) {
            case "none":
            case "modify":
            case "create":
                return [];
            case "pr":
                return [new Tag(TagKey.Hidden), new Tag(TagKey.PrFrom, article!._id)]
            case "modify-pr":
                const tags = article ? readTags(article) : {};
                return [new Tag(TagKey.Hidden), new Tag(TagKey.PrFrom, tags["pr-from"] as string)]
        }
    }, [props.permission, article]);

    function useTags() {
        let draft: Tag[] | undefined = undefined;
        if (typeof localStorage === 'object') {
            const read = localStorage.getItem(`${storageIdentifier}.tags`);
            if (read) {
                draft = (JSON.parse(read) as string[]).map(Tag.readTag);
            } else {
                draft = article?.tags?.map(Tag.readTag)?.filter(t => !hardcodedTags.find(h => h.key == t.key));
            }
        }
        return useState(draft ?? []);
    }

    const [title, setTitle] = useSaved('title', article?.title ?? '');

    const [forward, setForward] = useSaved('forward', article?.forward ?? '');
    const [cover, setCover] = useSaved<File | ImageID>('cover', article?.cover ?? '');
    const [value, setValue] = useSaved('body', props.body ?? '');
    const [preload, setPreload] = useState<LocalImage>({});
    const [tags, setTags] = useTags();
    function saveFunc(type: string, content: () => string): () => void {
        const id = storageIdentifier;
        return () => {
            localStorage.setItem(`${id}.${type}`, content())
        }
    }

    useEffect(saveFunc('title', () => title), [title]);
    useEffect(saveFunc('forward', () => forward), [forward]);
    useEffect(saveFunc('body', () => value!), [value]);
    useEffect(() => {
        if (typeof cover === 'string') {
            localStorage.setItem(storageIdentifier + ".cover", cover)
        }
    }, [cover]);
    useEffect(saveFunc('tags', () => JSON.stringify(tags.map(v => v.toString()))), [tags]);

    const [activeStep, setActiveStep] = useState(0);
    const lastStep = 2;
    const stepIncrease = (i: number) => setActiveStep(activeStep + i);

    const [progress, setProgress] = useState(-1);
    const handleResult = useRequestResult(
        () => {
            ['cover', 'title', 'ref', 'body', 'tags'].forEach(v => localStorage.removeItem(`${storageIdentifier}.${v}`));
            router.push('/article');
        },
        () => {
            setProgress(-1);
            setActiveStep(lastStep);
        }
    )

    async function handleSubmit() {
        setProgress(0);
        if (!title || !forward || !value || !executeRecaptcha) {
            handleResult({success: false, msg: 'bug'})
            return;
        }

        const ref = article ? article._id : await beginPost('articles');
        const {source, cover, stop} = await presubmit(ref);
        if (stop) return;

        const token = await executeRecaptcha();
        let body: any = {ref, title, forward, token, cover, body: source, tags: tags.map(t => t.toString())};
        if (article) {
            const original = article;
            body.edit = true;
            body.id = original._id;
            if (body.title === original.title) {
                delete body.title;
            }
            if (body.forward === original.forward) {
                delete body.forward;
            }
            if (body.cover === original.cover || !body.cover) {
                delete body.cover
            }
            if (source === props.body) {
                delete body.body
            }
        }

        const res = await fetchApi('/api/article', body);
        handleResult(await getResponseRemark(res));
    }

    /**
     * Preceding steps of article uploading, which is basically image uploading
     * @param ref id to the article
     * @return some object containing the refactored passage body
     */
    async function presubmit(ref: string): Promise<{ source: string, cover?: string, stop?: boolean }> {
        let coverId: string | undefined = article?.cover;
        const preloadKeys = Object.getOwnPropertyNames(preload);
        const stepCount = preloadKeys.length + 1;
        if (typeof cover === 'string') {
            coverId = cover;
        } else if (cover) {
            // upload new cover
            const token = await executeRecaptcha!();
            const res = await uploadImage(cover as File, token, 'cover', [ref]);
            const remark = await getResponseRemark(res);
            if (!remark.success) {
                handleResult(remark);
                return {
                    source: '',
                    stop: true
                }
            }
            coverId = await res.text();
        }
        setProgress(1 / stepCount * 100);

        let source = value!;
        for (let i = 0; i < preloadKeys.length; i++) {
            const key = preloadKeys[i];
            const image = preload[key];
            const token = await executeRecaptcha!();
            const res = await uploadImage(image, token, 'post', [ref]);
            const remark = await getResponseRemark(res);
            if (!remark.success) {
                // upload failure
                handleResult(remark);
                return {
                    source: '',
                    stop: true
                }
            }

            const imageId = await res.text();
            source = source.replaceAll(key, imageId);

            setProgress((i + 2) / stepCount * 100)
        }

        return {
            cover: coverId,
            source
        }
    }

    useEffect(() => {
        if (activeStep > lastStep) {
            handleSubmit();
        }
    }, [activeStep]);

    return <>
        <Modal open={progress >= 0} sx={{transitionDelay: '400ms'}}>
            <LinearProgress variant={progress > 0 ? "determinate" : "indeterminate"} value={progress}/>
        </Modal>
        <Stepper activeStep={activeStep} orientation="vertical">
            <Step key="metadata">
                <StepLabel
                    optional={title && forward &&
                        <Collapse in={activeStep > 0}>
                            <Stack>
                                <Typography variant="caption">标题：{title}</Typography>
                                <Typography variant="caption">导读：{forward}</Typography>
                            </Stack>
                        </Collapse>}>
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
                    />
                </StepContent>
            </Step>
            <Step key="content">
                <StepLabel optional={<Typography variant="caption">{value?.length ?? 0}字符</Typography>}>
                    内容
                </StepLabel>
                <StepContent>
                    <MyEditor
                        value={value}
                        onChange={setValue}
                        preload={preload}
                        onUploadImage={(key, file) => {
                            const nextPreupload = preload;
                            preload[key] = file;
                            setPreload(nextPreupload);
                        }}
                    />
                    <Box mb={2} mt={2}>
                        <BackButton setter={stepIncrease}/>
                        <ContinueButton setter={stepIncrease}/>
                    </Box>
                </StepContent>
            </Step>
            <Step key="confirmation">
                <StepLabel optional={<Typography variant="caption">最后一步</Typography>}>
                    确认
                </StepLabel>
                <StepContent>
                    <Box mb={2}>
                        <BackButton setter={stepIncrease}/>
                        <ContinueButton setter={stepIncrease}>提交</ContinueButton>
                    </Box>
                </StepContent>
            </Step>
        </Stepper>
    </>
}

type PageProps = {
    article?: SafeArticle,
    body?: string,
    reCaptchaKey: string
}
export const getServerSideProps: GetServerSideProps<PageProps> = async (context) => {
    const {id} = context.query;
    const reCaptchaKey = process.env.RECAPTCHA_KEY_FRONTEND as string;
    if (id) {
        const article = await getArticle(id as string);
        if (article)
            return {
                props: {
                    article: getSafeArticle(article),
                    body: (await readAll(article.stream())).toString(),
                    reCaptchaKey
                }
            }
        else
            return {
                props: {reCaptchaKey},
                redirect: {
                    permanent: false,
                    destination: '/article/edit'
                }
            }
    }
    return {props: {reCaptchaKey}}
}

export default EditPage;
