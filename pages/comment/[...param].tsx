import { GetServerSideProps, NextPage } from "next";
import {
    CommentCard,
    CommentCardRoot,
    RenderingComment,
} from "../../components/CommentCard";
import PlaceHolder from "../../components/PlaceHolder";
import {Commentable, getComment, getComments} from "../../lib/db/comment";
import { getUser } from "../../lib/db/user";
import { getSafeComment } from "../../lib/safeComment";
import NoCommentIcon from "@mui/icons-material/CommentsDisabledOutlined";
import Stack from "@mui/material/Stack";
import Divider from "@mui/material/Divider";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { useTitle } from "../../lib/useTitle";
import { ReCaptchaScope } from "../../components/ReCaptchaScope";
import { ReCaptchaPolicy } from "../../components/ReCaptchaPolicy";
import { AnimatePresence, motion } from "framer-motion";
import {RenderingReview} from "../../components/ReviewCard";
import {getInspiration} from "../../lib/db/inspiration";

interface PageProps {
    current?: RenderingReview;
    children: RenderingReview[];
    reCaptchaKey?: string;
}

const CommentPage: NextPage<PageProps> = (props: PageProps) => {
    useTitle("评论");

    if (props.current) {
        return (
            <ReCaptchaScope reCaptchaKey={props.reCaptchaKey}>
                <CommentApp {...props} />
                <ReCaptchaPolicy sx={{ textAlign: "center" }} />
            </ReCaptchaScope>
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

function CommentApp(props: PageProps) {
    const router = useRouter();
    const [current, setCurrent] = useState(props.current!);
    const [children, setChildren] = useState(props.children);
    useEffect(() => {
        setCurrent(props.current!);
        setChildren(props.children);
    }, [props.current]);

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

    function handleReply(comment: RenderingComment) {
        setChildren(children.concat(comment));
    }

    return (
        <Stack spacing={2}>
            <CommentCardRoot
                data={current}
                onDeleted={handleDelete}
                onEdited={handleEdit}
                onReplied={handleReply}
                commentSectionDisabled={true}
            />
            {children.length > 0 && <Divider />}
            <AnimatePresence>
                {children.map((v) => (
                    <motion.div
                        key={v._id}
                        animate={{ x: 0 }}
                        exit={{ x: "-120%" }}
                    >
                        <CommentCard
                            data={v}
                            onDeleted={handleDelete}
                            onEdited={handleEdit}
                        />
                    </motion.div>
                ))}
            </AnimatePresence>
        </Stack>
    );
}

export const getServerSideProps: GetServerSideProps<PageProps> = async (
    context,
) => {
    const { param } = context.query;
    let current: RenderingReview | undefined;
    const type = param!.length > 1 ? param![0] as Commentable : 'comments';
    const id = param!.length > 1 ? param![1] : param![0];
    switch (type) {
        case "comments":
            const res = await getComment(id);
            if (res) {
                const {time, ...others} = res;
                current = others;
            }
            break;
        case "inspirations":
            current = await getInspiration(id);
            break;
    }
    if (!current) {
        return { props: { children: [] } };
    }
    const children = await getComments(current).then((v) =>
        v.map(getSafeComment),
    );
    const nicknameOf: { [key: string]: string } = {};
    const renderingCurrent: RenderingReview = {
        ...current,
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
        props: {
            current: renderingCurrent,
            children: renderingChildren,
            reCaptchaKey: process.env.RECAPTCHA_KEY_FRONTEND,
        },
    };
};

export default CommentPage;
