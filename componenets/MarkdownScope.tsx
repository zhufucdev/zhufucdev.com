import ReactMarkdown from "react-markdown";
import {Link} from "@mui/material";
import {markdownContract} from "../lib/contract";

type MarkdownScopeProps = {
    children: string
}

export function MarkdownScope(props: MarkdownScopeProps): JSX.Element {
    return <ReactMarkdown
        components={{a: Link}}
        remarkPlugins={markdownContract.plugins}
    >
        {props.children}
    </ReactMarkdown>
}
