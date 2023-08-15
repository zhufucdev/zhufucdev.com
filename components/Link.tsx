import MLink from '@mui/material/Link'
import NLink from 'next/link'
import { ReactNode } from 'react'

interface Props {
    href?: string
    children?: ReactNode
}

export default function Link({href, children}: Props) {
    return <MLink component={NLink} href={href} children={children} />
}

