import {
    Box,
    Button,
    ButtonProps,
    Collapse,
    Dialog,
    DialogContent,
    DialogTitle,
    SxProps,
} from '@mui/material'
import { ReactNode, useState } from 'react'
import HelperCard from './HelperCard'

interface Props {
    variant?: 'dialog' | 'collapse'
    title: ReactNode
    children: ReactNode
    sx?: SxProps
    buttonProps?: ButtonProps
    inline?: boolean
}

export default function Details({
    variant = 'collapse',
    title,
    children,
    sx,
    inline,
    buttonProps,
}: Props) {
    const [expanded, setExpanded] = useState(false)
    const buttonContent = expanded ? '隐藏详细' : '显示详细'
    switch (variant) {
        case 'dialog':
            const button = (
                <Button onClick={() => setExpanded(!expanded)} {...buttonProps}>
                    {buttonContent}
                </Button>
            )
            return (
                <>
                    {inline ? button : <Box sx={sx}>{button}</Box>}
                    <Dialog open={expanded} onClose={() => setExpanded(false)}>
                        <DialogTitle>{title}</DialogTitle>
                        <DialogContent>{children}</DialogContent>
                    </Dialog>
                </>
            )

        case 'collapse':
            return (
                <HelperCard title={title} sx={sx}>
                    <Collapse in={expanded}>{children}</Collapse>
                    <Box width="100%" display="flex" justifyContent="right">
                        <Button
                            onClick={() => setExpanded(!expanded)}
                            {...buttonProps}
                        >
                            {buttonContent}
                        </Button>
                    </Box>
                </HelperCard>
            )
    }
}
