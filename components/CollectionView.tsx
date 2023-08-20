import {
    Box,
    Card,
    CardContent,
    Fade,
    List,
    ListItemButton,
    SxProps,
    Typography,
    useTheme,
} from '@mui/material'
import PlaceHolder from './PlaceHolder'
import PlaylistRemoveIcon from '@mui/icons-material/PlaylistRemove'
import { RenderingCollection } from '../lib/renderingCollection'
import Link from 'next/link'
import { cacheImage, getArticleUri, getImageUri } from '../lib/utility'
import { useCallback, useRef, useState } from 'react'
import { SafeArticle } from '../lib/safeArticle'

interface Props {
    collection?: RenderingCollection
    sx?: SxProps
}

export default function CollectionView({ collection, sx }: Props) {
    if (!collection) {
        return <NoCollection />
    }

    const maxWidth = 550
    const [isFullWidth, setFullWidth] = useState(false)
    const [hasImg, setImg] = useState(false)
    const [ambientImg, setAmbientImg] = useState<string>()
    const theme = useTheme()
    const cardRef = useCallback((ele: HTMLDivElement) => {
        if (ele) {
            setFullWidth(ele.getBoundingClientRect().width >= maxWidth)
        }
    }, [])

    function handleHover(meta: SafeArticle) {
        if (!isFullWidth) {
            return
        }
        if (meta.cover) {
            const uri = getImageUri(meta.cover)
            cacheImage(uri).then(() => {
                setImg(true)
                setAmbientImg(uri)
            })
        } else {
            setImg(false)
        }
    }

    return (
        <Card
            sx={{ m: 'auto', borderRadius: 2, maxWidth: maxWidth, ...sx }}
            variant="outlined"
            ref={cardRef}
            onMouseLeave={() => setImg(false)}
        >
            <CardContent sx={{ position: 'relative' }}>
                {isFullWidth && (
                    <Fade in={hasImg}>
                        <Box
                            width="50%"
                            height="100%"
                            right={0}
                            top={0}
                            position="absolute"
                        >
                            <Box
                                position="absolute"
                                width="100%"
                                height="100%"
                                sx={{
                                    background: `linear-gradient(to right, ${theme.palette.background.paper} 0%, transparent 70%)`,
                                }}
                            />
                            <Box
                                component="img"
                                src={ambientImg}
                                width="100%"
                                height="100%"
                                sx={{ objectFit: 'cover' }}
                            />
                        </Box>
                    </Fade>
                )}
                <Typography variant="h6">目录</Typography>
                <List>
                    {collection.articles.map((meta, index) => (
                        <ListItemButton
                            key={meta._id}
                            sx={{ borderRadius: 1 }}
                            component={Link}
                            href={getArticleUri(meta._id)}
                            onMouseOver={() => handleHover(meta)}
                        >
                            <Typography>
                                {index + 1}. {meta.title}
                            </Typography>
                        </ListItemButton>
                    ))}
                </List>
            </CardContent>
        </Card>
    )
}

function NoCollection() {
    return <PlaceHolder title="此文章不是合集" icon={PlaylistRemoveIcon} />
}
