import ReactMarkdown from "react-markdown";
import {Link, useMediaQuery, useTheme} from "@mui/material";
import {Prism} from "react-syntax-highlighter";
import {dracula as dark, duotoneLight as light} from 'react-syntax-highlighter/dist/cjs/styles/prism';
import {LazyImage} from "./LazyImage";
import {ComponentPropsWithoutRef, useEffect, useState} from "react";
import {getImageUri} from "../lib/utility";

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

export function MarkdownScope(props: MarkdownScopeProps): JSX.Element {
    const theme = useTheme();
    const fixedDrawer = useMediaQuery(theme.breakpoints.up('sm'));
    const {preload, imageCache, newCache} = props;
    return (<ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw]}
        components={{
            a: Link,
            code({node, inline, className, children, ...props}) {
                const match = /language-(\w+)/.exec(className || '')
                return !inline && match ? (
                    <Prism
                        // @ts-ignore
                        style={theme.palette.mode === "dark" ? dark : light}
                        language={match[1]}
                        PreTag="div"
                        customStyle={{width: fixedDrawer ? '100%' : 'calc(100vw - 50px)'}}
                        {...props}
                    >
                        {String(children).replace(/\n$/, '')}
                    </Prism>
                ) : (
                    <code className={className} {...props}>
                        {children}
                    </code>
                )
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
