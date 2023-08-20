import {
    Box,
    Button,
    Paper,
    Skeleton,
    Typography,
    useTheme,
} from '@mui/material'
import { SafeArticle } from '../lib/safeArticle'
import SkipNextIcon from '@mui/icons-material/SkipNext'
import SkipPreviousIcon from '@mui/icons-material/SkipPrevious'
import Link from 'next/link'
import CLink from './Link'
import { getArticleUri } from '../lib/utility'

interface Props {
    next?: SafeArticle
    previous?: SafeArticle
    collectionTitle?: string
    loading: boolean
    collectionId: string
}

export default function CollectionSection({
    next,
    previous,
    collectionTitle,
    loading,
    collectionId,
}: Props) {
    const theme = useTheme()
    const hideOnSmall = { [theme.breakpoints.down('sm')]: { display: 'none' } }
    return (
        <Paper sx={{ p: 2, mt: 2, borderRadius: 2 }} variant="outlined">
            <Typography variant="h5" mb={1}>
                继续阅读
            </Typography>
            <Typography>
                {loading ? (
                    <Skeleton width={250} variant="text" />
                ) : (
                    <>
                        这篇文章收录在合集
                        <CLink href={getArticleUri(collectionId)}>
                            {collectionTitle}
                        </CLink>
                        中
                    </>
                )}
            </Typography>
            <Box
                display="flex"
                mt={1}
                sx={{
                    flexDirection: 'row',
                    [theme.breakpoints.down('sm')]: { flexDirection: 'column' },
                }}
            >
                {loading ? (
                    <Skeleton width={40} variant="text" />
                ) : (
                    previous && (
                        <Button
                            startIcon={<SkipPreviousIcon sx={hideOnSmall} />}
                            component={Link}
                            href={
                                {
                                    pathname: getArticleUri(previous._id),
                                    query: { coll: collectionId },
                                } as any
                            }
                        >
                            上一篇：{previous.title}
                        </Button>
                    )
                )}
                <span style={{ flexGrow: 1 }} />
                {loading ? (
                    <Skeleton width={40} variant="text" />
                ) : (
                    next && (
                        <Button
                            endIcon={<SkipNextIcon sx={hideOnSmall} />}
                            component={Link}
                            href={
                                {
                                    pathname: getArticleUri(next._id),
                                    query: { coll: collectionId },
                                } as any
                            }
                        >
                            下一篇：{next.title}
                        </Button>
                    )
                )}
            </Box>
        </Paper>
    )
}
