import { Box, Paper, SxProps, Typography, useTheme } from '@mui/material'
import { ReactNode } from 'react'
import DoneAllIcon from '@mui/icons-material/DoneAll';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline'
import WarningAmberIcon from '@mui/icons-material/WarningAmber'
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';

interface Props {
    variant?: 'help' | 'success' | 'warn' | 'error'
    sx?: SxProps
    title: ReactNode
    content: ReactNode
}

export default function HelperCard({ variant, sx, title, content }: Props) {
    const theme = useTheme()
    let icon: JSX.Element
    let color: string
    switch (variant) {
        case 'error':
            icon = <ErrorOutlineIcon />
            color = theme.palette.error.main
            break
        case 'warn':
            icon = <WarningAmberIcon />
            color = theme.palette.warning.main
            break
        case 'success':
            icon = <DoneAllIcon />
            color = theme.palette.success.main
        default:
            icon = <HelpOutlineIcon />
            color = theme.palette.background.paper
            break
    }

    return (
        <Paper variant="outlined" sx={{ width: '100%', p: 2, background: color, mb: 1, ...sx }}>
            <Box display="flex" alignItems="center" mb={1}>
                {icon}
                <Typography variant="h6" ml={1}>
                    {title}
                </Typography>
            </Box>
            {content}
        </Paper>
    )
}
