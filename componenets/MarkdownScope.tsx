import ReactMarkdown from "react-markdown";
import {Link, useTheme} from "@mui/material";
import {markdownContract} from "../lib/contract";
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
    return <LazyImage src={content} alt="" style={{maxHeight: '200px'}}/>
}

export function MarkdownScope(props: MarkdownScopeProps): JSX.Element {
    const theme = useTheme();
    const {preload, imageCache, newCache} = props;
    return (<ReactMarkdown
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
        remarkPlugins={markdownContract.plugins}
    >
        {props.children || ''}
    </ReactMarkdown>)
}