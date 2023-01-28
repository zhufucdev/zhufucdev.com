import {GetServerSideProps, NextPage} from "next";
import dynamic from "next/dynamic";
import {getArticle} from "../../lib/db/article";
import {useTitle} from "../../lib/useTitle";
import {useEffect, useState} from "react";

import {MarkdownScope} from "../../componenets/MarkdownScope";
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
import {lookupUser, useUser} from "../../lib/useUser";
import {getResponseRemark, hasPermission} from "../../lib/contract";
import {ReCaptchaScope} from "../../componenets/ReCaptchaScope";
import PlaceHolder from "../../componenets/PlaceHolder";

import PictureIcon from "@mui/icons-material/PhotoOutlined";
import LockedIcon from "@mui/icons-material/PublicOffOutlined";
import {useRequestResult} from "../../lib/useRequestResult";
import {useRouter} from "next/router";
import {fetchApi, readAll} from "../../lib/utility";
import {useGoogleReCaptcha} from "react-google-recaptcha-v3";
import {getSafeArticle, SafeArticle} from "../../lib/getSafeArticle";

const MDEditor = dynamic(
    () => import("@uiw/react-md-editor").then(m => m.default),
    {ssr: false}
);

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

type MetadataProps = {
    title: string,
    forward: string,
    cover?: File | ImageID,
    onTitleChanged: (title: string) => void,
    onForwardChanged: (forward: string) => void,
    onCoverChanged: (target: ImageID | File) => void,
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
        />
    </>
}

function PageContent(props: PageProps): JSX.Element {
    const router = useRouter();
    const {executeRecaptcha} = useGoogleReCaptcha();

    const [title, setTitle] = useState(props.article?.title ?? '');
    const [forward, setForward] = useState(props.article?.forward ?? '');
    const [cover, setCover] = useState<File | ImageID>();
    const [coverId, setCoverId] = useState('');
    const [value, setValue] = useState(props.body);

    const [activeStep, setActiveStep] = useState(0);
    const lastStep = 2;
    const stepIncrease = (i: number) => setActiveStep(activeStep + i);

    const [loading, setLoading] = useState(false);
    const handleResult = useRequestResult(
        () => {
            router.push('/article')
        },
        () => {
            setLoading(false);
            setActiveStep(lastStep);
        }
    )

    async function handleSubmit() {
        setLoading(true);
        if (!title || !forward || !value || !executeRecaptcha) {
            handleResult({success: false, msg: 'bug'})
            return;
        }
        const token = await executeRecaptcha();
        let body: any = {title, forward, token, body: value};
        if (coverId) body.cover = coverId;

        if (props.article) {
            const original = props.article
            body.id = original._id;
            if (body.title === original.title) {
                delete body.title;
            }
            if (body.forward === original.forward) {
                delete body.forward;
            }
            if (body.cover === original.cover) {
                delete body.cover
            }
            if (value === props.body) {
                delete body.body
            }
        }

        const res = await fetchApi('/api/article', body);
        handleResult(await getResponseRemark(res));
    }

    useEffect(() => {
        if (activeStep > lastStep) {
            handleSubmit();
        }
    }, [activeStep]);

    useEffect(() => {
        if (typeof cover === 'string') {
            setCoverId(cover);
        }
    }, [cover]);

    return <>
        <Modal open={loading} sx={{transitionDelay: '400ms'}}>
            <LinearProgress variant="indeterminate"/>
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
                    />
                </StepContent>
            </Step>
            <Step key="content">
                <StepLabel optional={<Typography variant="caption">{value?.length ?? 0}字符</Typography>}>
                    内容
                </StepLabel>
                <StepContent>
                    <MDEditor
                        value={value}
                        onChange={setValue}
                        components={{
                            preview: (source) => <MarkdownScope>{source}</MarkdownScope>
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

const EditPage: NextPage<PageProps> = (props) => {
    useTitle(props.body ? '编辑文章' : '草拟文章');
    const {user, isLoading} = useUser();
    const [isPermitted, setPermission] = useState(true);

    useEffect(() => {
        if (!isLoading) {
            if (!user) {
                setPermission(false);
            } else {
                lookupUser(user).then(u => {
                    if (!u) {
                        setPermission(false);
                    } else {
                        if (!hasPermission(u, 'post_article')) {
                            setPermission(false);
                        }
                    }
                })
            }
        }
    }, [isLoading, user])

    return <ReCaptchaScope reCaptchaKey={props.reCaptchaKey}>
        {
            isPermitted ?
                <PageContent {...props}/>
                : <PlaceHolder icon={LockedIcon} title="做得好，下次别做了"/>
        }
    </ReCaptchaScope>
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
