import ReactMarkdown from "react-markdown";
import {Link} from "@mui/material";

type MarkdownScopeProps = {
    children: string
}

export function MarkdownScope(props: MarkdownScopeProps): JSX.Element {
    return <ReactMarkdown
        components={{a: Link}}>
        {props.children}
    </ReactMarkdown>
}
