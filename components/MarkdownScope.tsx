import {
    Button,
    Card,
    IconButton,
    Paper,
    styled,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Tooltip,
    useMediaQuery,
    useTheme,
} from '@mui/material'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import { useSnackbar } from 'notistack'
import Divider from '@mui/material/Divider'
import { ImageViewer } from './ImageViewer'
import Link from './Link'
import { Prism } from 'react-syntax-highlighter'
import {
    dracula as dark,
    duotoneLight as light,
} from 'react-syntax-highlighter/dist/cjs/styles/prism'
import { LazyImage } from './LazyImage'
import {
    ComponentPropsWithoutRef,
    ReactNode,
    useEffect,
    useMemo,
    useState,
} from 'react'
import { getImageUri } from '../lib/utility'
import { MDXRemote, MDXRemoteSerializeResult } from 'next-mdx-remote'

import CopyIcon from '@mui/icons-material/ContentCopyOutlined'
import HelperCard from './HelperCard'
import Details from './Details'
import Repo from './Repo'

export type LocalImage = { [key: string]: File }
export type LocalCache = { [key: string]: string }
type ImageProps = {
    /**
     * Images that will be uploaded to the server.
     *
     * Key of which is locally generated, so should be replaced after uploaded
     */
    preload?: LocalImage
    /**
     * To optimize performance, optional
     */
    imageCache?: LocalCache
    /**
     * To optimize performance, optional
     * @param key key to the image {@link preload}
     * @param cache some base64 (maybe)
     */
    newCache?: (key: string, cache: string) => void
}

export interface MarkdownScopeProps extends ImageProps {
    children: MDXRemoteSerializeResult
    lazy?: boolean
}

const components = {
    Button,
    HelperCard,
    Details,
    Box,
    Repo,
}

const StyledCodeBlock = styled('code')(
    ({ theme }) => `
    background: ${
        theme.palette.mode === 'light'
            ? theme.palette.grey.A200
            : theme.palette.grey.A700
    };
    border-radius: 4px;
    padding: 2px;
`
)

export function MarkdownScope(props: MarkdownScopeProps): JSX.Element {
    const { preload, imageCache, newCache } = props

    return (
        <MDXRemote
            {...props.children}
            lazy={props.lazy}
            components={{
                a({ href, children }) {
                    return <Link href={href ?? ''}>{children}</Link>
                },
                code({ className, children, ...props }) {
                    const match = /language-(\w+)/.exec(className || '')
                    return match ? (
                        <MdCode
                            lang={(match && match[1]) ?? 'plain'}
                            {...props}
                        >
                            {children}
                        </MdCode>
                    ) : (
                        <StyledCodeBlock className={className} {...props}>
                            {children}
                        </StyledCodeBlock>
                    )
                },
                img(props) {
                    return (
                        <MdImage
                            {...props}
                            preload={preload}
                            imageCache={imageCache}
                            newCache={newCache}
                        />
                    )
                },
                table({ children }) {
                    return (
                        <TableContainer component={Paper}>
                            <Table sx={{minWidth: 650}}>{children}</Table>
                        </TableContainer>
                    )
                },
                thread({ chilren }) {
                    return <TableHead>{chilren}</TableHead>
                },
                tr({ children }) {
                    return (
                        <TableRow
                            sx={{
                                '&:last-child td, &:last-child th': {
                                    border: 0,
                                },
                            }}
                        >
                            {children}
                        </TableRow>
                    )
                },
                th({ children, align }) {
                    return (
                        <TableCell align={align as any}>{children}</TableCell>
                    )
                },
                td({ children, align }) {
                    return (
                        <TableCell align={align as any}>{children}</TableCell>
                    )
                },
                tbody({ children }) {
                    return <TableBody>{children}</TableBody>
                },
                ...components,
            }}
        />
    )
}

function MdImage({
    src,
    preload,
    imageCache,
    newCache,
}: ComponentPropsWithoutRef<'img'> & ImageProps): JSX.Element {
    const [content, setContent] = useState(src)
    const [viewer, setViewer] = useState(false)
    const [imageId, setImageId] = useState('')

    useEffect(() => {
        if (!src) return
        if (src.includes('/')) {
            setImageId('')
            setContent(src)
            return
        } else if (preload) {
            const local = preload[src]
            if (local) {
                if (imageCache && imageCache[src]) {
                    setImageId('')
                    setContent(imageCache[src])
                    return
                } else {
                    const reader = new FileReader()
                    reader.addEventListener('load', () => {
                        newCache?.call({}, src, reader.result as string)
                        setContent(reader.result as string)
                        setImageId('')
                    })
                    reader.readAsDataURL(local)
                    return
                }
            }
        }
        setImageId(src)
        setContent(getImageUri(src))
    }, [src, preload, imageCache])

    return (
        <>
            <LazyImage
                src={content}
                alt=""
                style={{
                    maxHeight: '200px',
                    maxWidth: 'calc(100% - 50px)',
                    display: 'block',
                    margin: 'auto',
                }}
                waveSx={{
                    width: '50%',
                    height: '120px',
                }}
                onClick={() => setViewer(true)}
            />
            <ImageViewer
                open={viewer}
                onClose={() => setViewer(false)}
                {...(imageId ? { image: imageId } : { src: content })}
            />
        </>
    )
}

function MdCode(props: { lang: string; children: ReactNode }) {
    const theme = useTheme()
    const darkTheme = theme.palette.mode === 'dark'
    const fixedDrawer = useMediaQuery(theme.breakpoints.up('sm'))
    const codeBody = useMemo(
        () => String(props.children).replace(/\n$/, ''),
        [props.children]
    )
    const { enqueueSnackbar } = useSnackbar()

    async function handleCopy() {
        await navigator.clipboard.writeText(codeBody)
        enqueueSnackbar('已复制，别忘了给我打钱', { variant: 'success' })
    }

    return (
        <>
            <Card
                elevation={1}
                variant="outlined"
                sx={{
                    background: darkTheme
                        ? `rgb(40, 42, 53)`
                        : `rgb(250, 248, 246)`,
                }}
            >
                <Prism
                    style={darkTheme ? dark : light}
                    language={props.lang}
                    PreTag="div"
                    customStyle={{
                        width: fixedDrawer ? '100%' : 'calc(100vw - 50px)',
                    }}
                    {...props}
                >
                    {codeBody}
                </Prism>
                <Divider />
                <Box display="flex" alignItems="center">
                    <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ flexGrow: 1, ml: 2 }}
                    >
                        {props.lang === 'plain'
                            ? '不知道是啥语言'
                            : props.lang + ' 代码'}
                    </Typography>
                    <Tooltip title="复制">
                        <IconButton onClick={handleCopy}>
                            <CopyIcon fontSize="small" />
                        </IconButton>
                    </Tooltip>
                </Box>
            </Card>
        </>
    )
}
