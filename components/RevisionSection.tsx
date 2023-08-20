import { Grid, Stack, SxProps, useTheme } from "@mui/material"
import { AnimatePresence, motion } from "framer-motion"
import { useState } from "react"
import { useProfileContext } from "../lib/useUser"
import { RenderingArticle } from "./ArticleCard"
import ArticleComment from "./ArticleComment"
import ArticlePr from "./ArticlePr"
import { CommentCard, RenderingComment } from "./CommentCard"
import LoginPopover from "./LoginPopover"

interface RevisionProps {
    meta: RenderingArticle
    sx?: SxProps
    comments: RenderingComment[]
}

export default function RevisionSection({ meta, sx, comments: _comments }: RevisionProps) {
    const theme = useTheme()
    const { user } = useProfileContext()
    const [comments, setComments] = useState(_comments)
    const [reviewing, setReviewing] = useState<HTMLElement>()
    const [commenting, setCommenting] = useState(false)

    async function handleDelete(target: RenderingComment) {
        const index = comments.findIndex((v) => v._id === target._id)
        if (index < 0) return
        setComments(comments.slice(0, index).concat(comments.slice(index + 1)))
    }

    async function handleEdit(target: RenderingComment, newContent: string) {
        const index = comments.findIndex((v) => v._id === target._id)
        if (index < 0) return
        setComments(
            comments
                .slice(0, index)
                .concat(
                    { ...target, body: newContent, edited: true },
                    comments.slice(index + 1)
                )
        )
    }

    const container = {
        flexGrow: 1,
        [theme.breakpoints.up('sm')]: {
            flexGrow: 1,
            flex: 1,
        },
    }

    return (
        <motion.div layout>
            <Grid
                container
                spacing={2}
                sx={{
                    ...sx,
                    flexDirection: commenting ? 'column' : 'row',
                }}
                component={motion.div}
                layout
            >
                <Grid item sx={container} key="comment-card">
                    <ArticleComment
                        expanded={commenting}
                        setExpanded={setCommenting}
                        articleId={meta._id}
                        postComment={(c) => setComments(comments.concat(c))}
                        setPrimaryButton={setReviewing}
                    />
                </Grid>

                <Grid
                    item
                    key="pr-card"
                    sx={container}
                    component={motion.div}
                    variants={{
                        rest: { opacity: 1 },
                        disabled: { opacity: 0.4 },
                    }}
                    animate={commenting ? 'disabled' : 'rest'}
                >
                    <ArticlePr
                        commenting={commenting}
                        articleId={meta._id}
                        setPrimaryButton={setReviewing}
                    />
                </Grid>
            </Grid>

            <Stack spacing={2} mt={2}>
                <AnimatePresence initial={false}>
                    {comments.map((c) => (
                        <motion.div
                            key={c._id}
                            animate={{ x: 0 }}
                            exit={{ x: '-120%' }}
                        >
                            <CommentCard
                                data={c}
                                onDeleted={handleDelete}
                                onEdited={handleEdit}
                            />
                        </motion.div>
                    ))}
                </AnimatePresence>
            </Stack>

            <LoginPopover
                open={Boolean(reviewing) && !user}
                onClose={() => setReviewing(undefined)}
                anchorEl={reviewing}
            />
        </motion.div>
    )
}
