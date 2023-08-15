import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import CardActions from '@mui/material/CardActions'
import Button from '@mui/material/Button'
import CommentIcon from '@mui/icons-material/CommentOutlined'
import { ChatInputField } from './ChatInputField'
import Card from '@mui/material/Card'
import { useProfileContext } from '../lib/useUser'
import { MouseEventHandler, useEffect, useMemo, useState } from 'react'
import { CommentUtil, RenderingCommentUtil } from '../lib/comment'
import { hasPermission, reCaptchaNotReady } from '../lib/contract'
import { postComment } from '../lib/utility'
import { useGoogleReCaptcha } from 'react-google-recaptcha-v3'
import { useRequestResult } from '../lib/useRequestResult'
import { RenderingComment } from './CommentCard'

interface Props {
    expanded: boolean
    setExpanded: (newValue: boolean) => void
    setPrimaryButton?: (ele: HTMLButtonElement) => void
    articleId: string
    postComment: (newComment: RenderingComment) => void
}

export default function ArticleComment({
    expanded,
    setExpanded,
    setPrimaryButton,
    articleId,
    postComment: setComment,
}: Props) {
    const { user } = useProfileContext()

    const { executeRecaptcha } = useGoogleReCaptcha()
    const handleCommentResult = useRequestResult((_, id) => {
        setExpanded(false)
        handleNewComment(id as string, commentBuffer)
        setCommentBuf('')
    })
    const canComment = useMemo(
        () => user && hasPermission(user, 'comment'),
        [user]
    )
    const [commentBuffer, setCommentBuf] = useState('')
    const [chatboxRevealed, setChatboxRevealed] = useState(false)
    const [postingComment, setPostingComment] = useState(false)
    const commentBufOverflow = useMemo(
        () => CommentUtil.checkLength(commentBuffer) > CommentUtil.maxLength,
        [commentBuffer]
    )
    const shouldComment = useMemo(
        () => CommentUtil.validBody(commentBuffer),
        [commentBuffer]
    )
    const handleComment: MouseEventHandler<HTMLButtonElement> = (event) => {
        setPrimaryButton?.apply(null, [event.currentTarget])
        if (!canComment) return
        setExpanded(!expanded)
    }

    useEffect(() => {
        setTimeout(() => setChatboxRevealed(expanded), 20)
    }, [expanded])

    function handleNewComment(id: string, body: string) {
        const comment = RenderingCommentUtil.create(user!, body, id)
        setComment(comment)
    }

    async function handleCommentSubmit() {
        if (!executeRecaptcha) {
            handleCommentResult(reCaptchaNotReady)
            return
        }

        setPostingComment(true)
        const token = await executeRecaptcha()
        const res = await postComment(
            'articles',
            articleId,
            commentBuffer,
            token
        )
        setExpanded(false)
        if (res.ok) {
            handleCommentResult({ success: true }, await res.text())
        } else {
            let msg: string
            switch (res.status) {
                case 500:
                    msg = '一个bug导致服务器未响应'
                    break
                case 400:
                    msg = '人机验证失败'
                    break
                case 403:
                    msg = '没有权限'
                    break
                default:
                    msg = '咋回事？'
            }
            handleCommentResult({
                success: false,
                msg,
                respond: await res.text(),
            })
        }
        setPostingComment(false)
    }

    return (
        <Card sx={{ borderRadius: '12px' }}>
            <CardContent>
                <Typography variant="h5" gutterBottom>
                    你的观点
                </Typography>
                <Typography variant="body1">
                    留下你的评论，我是不会读的。
                </Typography>
            </CardContent>
            <CardActions sx={{ ml: 0.5, mt: -1, height: '64px' }}>
                {!chatboxRevealed && (
                    <Button
                        startIcon={<CommentIcon />}
                        disabled={user && !canComment}
                        onClick={handleComment}
                        sx={{ position: 'absolute' }}
                    >
                        评论
                    </Button>
                )}
                <ChatInputField
                    fullWidth
                    revealingStart="left"
                    revealed={chatboxRevealed}
                    onSend={handleCommentSubmit}
                    isSending={postingComment}
                    value={commentBuffer}
                    onValueChanged={setCommentBuf}
                    sendDisabled={!shouldComment}
                    onBlur={() => {
                        if (!commentBuffer) {
                            setExpanded(false)
                        }
                    }}
                    error={commentBufOverflow}
                />
            </CardActions>
        </Card>
    )
}
