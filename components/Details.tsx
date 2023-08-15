import {
    Box,
    Button,
    ButtonProps,
    Collapse,
    Dialog,
    DialogContent,
    DialogTitle,
} from '@mui/material'
import { ReactNode, useState } from 'react'
import HelperCard from './HelperCard'

interface Props {
    variant?: 'dialog' | 'collapse'
    title: ReactNode
    children: ReactNode
    buttonProps?: ButtonProps
}

export default function Details({ variant, title, children, buttonProps }: Props) {
    const [expanded, setExpanded] = useState(false)
    const buttonContent = expanded ? '隐藏详细' : '显示详细'
    switch (variant) {
        case 'dialog':
            return (
                <>
                    <Box>
                        <Button onClick={() => setExpanded(!expanded)} {...buttonProps}>
                            {buttonContent}
                        </Button>
                    </Box>
                    <Dialog open={expanded} onClose={() => setExpanded(false)}>
                        <DialogTitle>{title}</DialogTitle>
                        <DialogContent>{children}</DialogContent>
                    </Dialog>
                </>
            )

        case 'collapse':
        default:
            return (
                <HelperCard title={title}>
                    <Collapse in={expanded}>{children}</Collapse>
                    <Box width="100%" display="flex" justifyContent="right">
                        <Button onClick={() => setExpanded(!expanded)} {...buttonProps}>
                            {buttonContent}
                        </Button>
                    </Box>
                </HelperCard>
            )
    }
}
