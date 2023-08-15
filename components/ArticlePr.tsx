import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import CardActions from '@mui/material/CardActions'
import Button from '@mui/material/Button'
import PrIcon from '@mui/icons-material/DriveFileRenameOutline'
import Card from '@mui/material/Card'
import { useProfileContext } from '../lib/useUser'
import { MouseEventHandler, useMemo } from 'react'
import { useRouter } from 'next/router'
import { hasPermission } from '../lib/contract'

interface Props {
    commenting: boolean
    articleId: string
    setPrimaryButton: (ele: HTMLButtonElement) => void
}

export default function ArticlePr({
    commenting,
    articleId,
    setPrimaryButton,
}: Props) {
    const { user } = useProfileContext()
    const router = useRouter()

    const canPr = useMemo(
        () => user && hasPermission(user, 'pr_article'),
        [user]
    )
    const handlePr: MouseEventHandler<HTMLButtonElement> = (event) => {
        setPrimaryButton(event.currentTarget)
        if (canPr) {
            router.push(`/article/edit?id=${articleId}`)
        }
    }

    return (
        <Card sx={{ borderRadius: '12px' }}>
            <CardContent>
                <Typography variant="h5" gutterBottom>
                    拉取请求
                </Typography>
                <Typography variant="body1">
                    写得不咋样？你可以帮助改进这篇文章。
                </Typography>
            </CardContent>
            <CardActions sx={{ ml: 0.5, mt: -1, height: '64px' }}>
                <Button
                    startIcon={<PrIcon />}
                    disabled={(user && !canPr) || commenting}
                    onClick={handlePr}
                >
                    发起拉取请求
                </Button>
            </CardActions>
        </Card>
    )
}
