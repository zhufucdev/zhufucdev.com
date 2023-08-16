import { styled, useTheme } from '@mui/material'
import NLink from 'next/link'

const Link = styled(NLink)(({ theme }) => ({
    color: theme.palette.primary.main,
    '&:hover': { textDecorationColor: theme.palette.primary.light },
}))

export default Link
