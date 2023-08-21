import { Box, LinearProgress, Typography } from '@mui/material'
import Backdrop from '@mui/material/Backdrop'
import { LazyImage } from './LazyImage'

interface Props {
    open: boolean
}
export default function LoadingBackdrop({ open }: Props) {
    return (
        <Backdrop open={open} unmountOnExit={true} sx={{ zIndex: 10000 }}>
            <Box
                display="flex"
                justifyContent="center"
                flexDirection="column"
                alignItems="center"
            >
                <LazyImage
                    src="/favicon.webp"
                    alt="favicon"
                    style={{ borderRadius: '100%', maxWidth: 120 }}
                />

                <Typography color="white" variant="h6">加载资源</Typography>
                <LinearProgress sx={{ width: '100%' }} />
            </Box>
        </Backdrop>
    )
}
