import ReactMarkdown from "react-markdown";
import {Link, useTheme} from "@mui/material";
import {markdownContract} from "../lib/contract";
import {Prism} from "react-syntax-highlighter";
import { dracula as dark, duotoneLight as light } from 'react-syntax-highlighter/dist/cjs/styles/prism';

type MarkdownScopeProps = {
    children: string | undefined
}

export function MarkdownScope(props: MarkdownScopeProps): JSX.Element {
    const theme = useTheme();
    return <ReactMarkdown
        components={{
            a: Link,
            code({node, inline, className, children, ...props}) {
                const match = /language-(\w+)/.exec(className || '')
                return !inline && match ? (
                    <Prism
                        // @ts-ignore
                        style={theme.palette.mode === "dark" ? dark: light}
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
            }
        }}
        remarkPlugins={markdownContract.plugins}
    >
        {props.children || ''}
    </ReactMarkdown>
}
