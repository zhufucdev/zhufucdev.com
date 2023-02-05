import ReactMarkdown from "react-markdown";
import {Card, IconButton, Link, styled, Tooltip, useMediaQuery, useTheme} from "@mui/material";
import {Prism} from "react-syntax-highlighter";
import {dracula as dark, duotoneLight as light} from 'react-syntax-highlighter/dist/cjs/styles/prism';
import {LazyImage} from "./LazyImage";
import {ComponentPropsWithoutRef, ReactNode, useEffect, useMemo, useState} from "react";
import {getImageUri} from "../lib/utility";

import CopyIcon from "@mui/icons-material/ContentCopyOutlined";

export type LocalImage = { [key: string]: File };
export type LocalCache = { [key: string]: string };
type ImageProps = {
    /**
     * Images that will be uploaded to the server.
     *
     * Key of which is locally generated, so should be replaced after uploaded
     */
    preload?: LocalImage;
    /**
     * To optimize performance, optional
     */
    imageCache?: LocalCache;
    /**
     * To optimize performance, optional
     * @param key key to the image {@link preload}
     * @param cache some base64 (maybe)
     */
    newCache?: (key: string, cache: string) => void;
}

interface MarkdownScopeProps extends ImageProps {
    children: string | undefined;
}

import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import {useSnackbar} from "notistack";
import Divider from "@mui/material/Divider";

export function MarkdownScope(props: MarkdownScopeProps): JSX.Element {
    const theme = useTheme();
    const {preload, imageCache, newCache} = props;

    const StyledCodeBlock = styled("code")`
      background: ${theme.palette.mode === 'light' ? theme.palette.grey.A200 : theme.palette.grey.A700};
      border-radius: 4px;
      padding: 2px;
    `;

    return (<ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw]}
        components={{
            a: Link,
            code({node, inline, className, children, ...props}) {
                const match = /language-(\w+)/.exec(className || '')
                return !inline
                    ? <MdCode lang={(match && match[1]) ?? 'plain'} {...props}>{children}</MdCode>
                    : <StyledCodeBlock className={className} {...props}>{children}</StyledCodeBlock>
            },
            img(props) {
                return <MdImage
                    {...props}
                    preload={preload}
                    imageCache={imageCache}
                    newCache={newCache}/>
            }
        }}
    >
        {props.children || ''}
    </ReactMarkdown>)
}

function MdImage({src, preload, imageCache, newCache}: ComponentPropsWithoutRef<"img"> & ImageProps): JSX.Element {
    const [content, setContent] = useState(src);
    useEffect(() => {
        if (!src) return
        if (src.includes('/')) {
            setContent(src);
            return
        } else if (preload) {
            const local = preload[src];
            if (local) {
                if (imageCache && imageCache[src]) {
                    setContent(imageCache[src]);
                    return
                } else {
                    const reader = new FileReader();
                    reader.addEventListener('load', () => {
                        newCache?.call({}, src, reader.result as string);
                        setContent(reader.result as string);
                    })
                    reader.readAsDataURL(local);
                    return
                }
            }
        }
        setContent(getImageUri(src));
    }, [src, preload, imageCache]);
    return <LazyImage src={content} alt=""
                      style={{maxHeight: '200px', maxWidth: 'calc(100% - 50px)', display: 'block', margin: 'auto'}}/>
}

function MdCode(props: { lang: string, children: ReactNode & ReactNode[] }) {
    const theme = useTheme();
    const darkTheme = theme.palette.mode === 'dark';
    const fixedDrawer = useMediaQuery(theme.breakpoints.up('sm'));
    const codeBody = useMemo(() => String(props.children).replace(/\n$/, ''), [props.children])
    const {enqueueSnackbar} = useSnackbar();

    async function handleCopy() {
        await navigator.clipboard.writeText(codeBody);
        enqueueSnackbar('已复制，别忘了给我打钱', {variant: 'success'});
    }

    return <>
        <Card elevation={1} variant="outlined" sx={{background: darkTheme ? `rgb(40, 42, 53)` : `rgb(250, 248, 246)`}}>
            <Prism
                style={darkTheme ? dark : light}
                language={props.lang}
                PreTag="div"
                customStyle={{width: fixedDrawer ? '100%' : 'calc(100vw - 50px)'}}
                {...props}
            >
                {codeBody}
            </Prism>
            <Divider/>
            <Box display="flex" alignItems="center">
                <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{flexGrow: 1, ml: 2}}>
                    {props.lang === 'plain' ? '不知道是啥语言' : props.lang + ' 代码'}
                </Typography>
                <Tooltip title="复制">
                    <IconButton onClick={handleCopy}>
                        <CopyIcon fontSize="small"/>
                    </IconButton>
                </Tooltip>
            </Box>
        </Card>
    </>
}