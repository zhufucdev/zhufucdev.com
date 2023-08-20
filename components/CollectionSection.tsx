import { Box, Button, Paper, Typography } from '@mui/material'
import { SafeArticle } from '../lib/safeArticle'
import SkipNextIcon from '@mui/icons-material/SkipNext'
import SkipPreviousIcon from '@mui/icons-material/SkipPrevious'
import Link from 'next/link'
import CLink from './Link'
import { getArticleUri } from '../lib/utility'

interface Props {
    next?: SafeArticle
    previous?: SafeArticle
    collectionTitle: string
    collectionId: string
}

export default function CollectionSection({
    next,
    previous,
    collectionTitle,
    collectionId,
}: Props) {
    return (
        <Paper sx={{ p: 2, mt: 2 }} variant="outlined">
            <Typography variant="h5" mb={1}>
                继续阅读
            </Typography>
            <Typography>
                这篇文章收录在合集
                <CLink href={getArticleUri(collectionId)}>
                    {collectionTitle}
                </CLink>
                中
            </Typography>
            <Box display="flex">
                {previous && (
                    <Button
                        startIcon={<SkipPreviousIcon />}
                        component={Link}
                        href={{
                            pathname: getArticleUri(previous._id),
                            query: { coll: collectionId },
                        }}
                    >
                        上一篇：{previous.title}
                    </Button>
                )}
                <span style={{ flexGrow: 1 }} />
                {next && (
                    <Button
                        endIcon={<SkipNextIcon />}
                        component={Link}
                        href={{
                            pathname: getArticleUri(next._id),
                            query: { coll: collectionId },
                        }}
                    >
                        下一篇：{next.title}
                    </Button>
                )}
            </Box>
        </Paper>
    )
}
