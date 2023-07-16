import { GetServerSideProps, NextPage } from "next";
import {
    CommentCard,
    CommentCardRoot,
    RenderingComment,
} from "../../componenets/CommentCard";
import PlaceHolder from "../../componenets/PlaceHolder";
import { getComment, getComments } from "../../lib/db/comment";
import { getUser } from "../../lib/db/user";
import { getSafeComment } from "../../lib/getSafeComment";
import NoCommentIcon from "@mui/icons-material/CommentsDisabledOutlined";
import Stack from "@mui/material/Stack";
import { useRouter } from "next/router";
import { useState } from "react";
import { Box, Divider } from "@mui/material";
import { useTitle } from "../../lib/useTitle";

interface PageProps {
    current?: RenderingComment;
    children: RenderingComment[];
}

const CommentPage: NextPage<PageProps> = (props: PageProps) => {
    useTitle('评论的回复')
    const router = useRouter();
    const [current, setCurrent] = useState(props.current);
    const [children, setChildren] = useState(props.children);

    function handleDelete(target: RenderingComment) {
        if (!current) return;
        if (target._id === current._id) {
            router.back();
        } else {
            const index = children.findIndex((v) => v._id === target._id);
            if (index < 0) {
                return;
            }
            setChildren(
                children.slice(0, index).concat(children.slice(index + 1)),
            );
        }
    }

    function handleEdit(target: RenderingComment, newValue: string) {
        if (!current) return;
        if (target._id === current._id) {
            setCurrent({ ...current, body: newValue });
        } else {
            const index = children.findIndex((v) => v._id === target._id);
            if (index < 0) {
                return;
            }
            setChildren(
                children
                    .slice(0, index)
                    .concat(
                        { ...children[index], body: newValue },
                        children.slice(index + 1),
                    ),
            );
        }
    }

    if (current) {
        return (
            <Stack spacing={2}>
                <CommentCardRoot
                    data={current}
                    onDeleted={handleDelete}
                    onEdited={handleEdit}
                    commentSectionDisabled={true}
                />
                {children.length > 0 && <Divider/>}
                {children.map((v, index) => (
                    <Box key={v._id}>
                        <CommentCard
                            data={v}
                            onDeleted={handleDelete}
                            onEdited={handleEdit}
                        />
                        {index < children.length - 1 && <Divider />}
                    </Box>
                ))}
            </Stack>
        );
    } else {
        return (
            <>
                <PlaceHolder
                    title="评论未找到"
                    icon={NoCommentIcon}
                    sx={{ mt: 2 }}
                />
            </>
        );
    }
};

export const getServerSideProps: GetServerSideProps<PageProps> = async (
    context,
) => {
    const { id } = context.query;
    const current = await getComment(id as string);
    if (!current) {
        return { props: { children: [] } };
    }
    const children = await getComments(current).then((v) =>
        v.map(getSafeComment),
    );
    const nicknameOf: { [key: string]: string } = {};
    const renderingCurrent: RenderingComment = {
        ...getSafeComment(current),
        raiserNick: (await getUser(current.raiser))?.nick,
    };
    if (renderingCurrent.raiserNick) {
        nicknameOf[renderingCurrent.raiser] = renderingCurrent.raiserNick;
    }

    const renderingChildren: RenderingComment[] = [];
    for (const child of children) {
        let nick: string | undefined = nicknameOf[child.raiser];
        if (!nick) {
            const user = await getUser(child.raiser);
            nick = user?.nick;
            if (nick) {
                nicknameOf[child.raiser] = nick;
            }
        }
        renderingChildren.push({ ...child, raiserNick: nick });
    }
    return {
        props: { current: renderingCurrent, children: renderingChildren },
    };
};

export default CommentPage;