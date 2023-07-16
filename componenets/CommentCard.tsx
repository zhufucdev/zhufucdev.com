import CircularProgress from "@mui/material/CircularProgress";
import ListItemIcon from "@mui/material/ListItemIcon";
import Menu, { MenuProps } from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Tooltip from "@mui/material/Tooltip";
import { motion } from "framer-motion";
import React, { useMemo, useState } from "react";
import { SafeComment } from "../lib/getSafeComment";
import { RenderingReview, ReviewCard, ReviewCardRoot } from "./ReviewCard";
import { useProfileContext } from "../lib/useUser";
import {
    getResponseRemark,
    hasPermission,
    reCaptchaNotReady,
} from "../lib/contract";

import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/DeleteOutline";
import EditedIcon from "@mui/icons-material/UpdateOutlined";
import { fetchApi } from "../lib/utility";
import { useGoogleReCaptcha } from "react-google-recaptcha-v3";
import { useRequestResult } from "../lib/useRequestResult";
import {
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,
    TextField,
} from "@mui/material";
import { ProgressSlider } from "./PrograssSlider";
import { DeleteAlertDialog } from "./DeleteAlertDialog";
import { CommentUtil } from "../lib/comment";

export type RenderingComment = SafeComment & RenderingReview;
interface CommentProps {
    data: RenderingComment;
    onDeleted: (target: SafeComment) => void;
    onEdited: (target: SafeComment, newContent: string) => void;
}

export function CommentCard(props: CommentProps) {
    return (
        <motion.div>
            <ReviewCard raiser={props.data.raiser}>
                <CommentCardRoot {...props} />
            </ReviewCard>
        </motion.div>
    );
}

function CommentCardRoot(props: CommentProps) {
    const [deleteDialog, setDeleteDialog] = useState(false);
    const [isDeleting, setDeleting] = useState(false);
    const [ctx, setCtx] = useState(false);
    const [isEditing, setEditing] = useState(false);
    const [editSubmiting, setEditSubmiting] = useState(false);
    const [editSumbitted, setEditSubmitted] = useState(false);
    const [editError, setEditError] = useState(false);
    const [editingBuffer, setEditingBuf] = useState("");
    const [bufError, setBufError] = useState(false);
    const { user } = useProfileContext();
    const { executeRecaptcha } = useGoogleReCaptcha();
    const handleDeleteResult = useRequestResult(() => {
        props.onDeleted(props.data);
    });
    const handleEditResult = useRequestResult(
        () => {
            setEditSubmitted(true);
            props.onEdited(props.data, editingBuffer);
        },
        () => setEditError(true),
    );
    const bufHelper = useMemo(() => {
                const len = CommentUtil.checkLength(editingBuffer);
                if (len > CommentUtil.maxLength * 0.6) {
                    return `${len} / ${CommentUtil.maxLength}`
                }
            }, [editingBuffer]);

    const canEdit = useMemo(
        () =>
            user &&
            (hasPermission(user, "modify") ||
                (props.data.raiser === user._id &&
                    hasPermission(user, "edit_own_post"))),
        [user],
    );

    async function handleDelete() {
        if (!executeRecaptcha) {
            handleDeleteResult(reCaptchaNotReady);
            return;
        }

        setCtx(false);
        setDeleting(true);
        const token = await executeRecaptcha();
        const res = await fetchApi(`/api/delete/comments/${props.data._id}`, {
            token,
        });
        if (res.ok) {
            handleDeleteResult({ success: true });
        } else {
            handleDeleteResult(await getResponseRemark(res));
        }
        setDeleting(false);
    }

    function handleEdit() {
        setEditingBuf(props.data.body);
        setEditing(true);
        setCtx(false);

        setEditSubmiting(false);
        setEditSubmitted(false);
        setEditError(false);
    }

    function handleBufChange(event: React.ChangeEvent<HTMLInputElement>) {
        const value = event.currentTarget.value;
        if (CommentUtil.validBody(value)) {
            setEditingBuf(value);
            setBufError(false);
        } else {
            setBufError(true);
        }
    }

    function handleEditClose() {
        setEditing(false);
        setCtx(false);
    }

    async function handleEditSubmit() {
        if (!executeRecaptcha) {
            handleEditResult(reCaptchaNotReady);
            return;
        }
        setEditSubmiting(true);
        const token = await executeRecaptcha();
        const res = await fetchApi(`/api/comment/${props.data._id}`, {
            token,
            body: editingBuffer,
        });
        const remark = await getResponseRemark(res);
        handleEditResult(remark);

        setTimeout(() => setEditing(false), 1000);
    }

    return (
        <>
            <ReviewCardRoot
                data={props.data}
                collectionId="comments"
                contextMenu={canEdit ? CommentContextMenu : undefined}
                contextMenuProps={{
                    onDelete: () => setDeleteDialog(true),
                    isDeleting,
                    onEdit: handleEdit,
                }}
                showContextMenu={ctx}
                onContextMenu={setCtx}
            >
                {props.data.edited && (
                    <Tooltip title="已修改">
                        <EditedIcon sx={{ mr: 1 }} />
                    </Tooltip>
                )}
            </ReviewCardRoot>
            <Dialog open={isEditing} onClose={handleEditClose}>
                <ProgressSlider
                    loading={editSubmiting}
                    done={editSumbitted}
                    error={editError}
                >
                    <DialogTitle>修改已有评论</DialogTitle>
                    <DialogContent>
                        <DialogContentText>
                            请尽可能在不改变原有句意的前提下落笔。
                        </DialogContentText>
                        <TextField
                            variant="outlined"
                            value={editingBuffer}
                            label="评论"
                            onChange={handleBufChange}
                            autoFocus
                            fullWidth
                            margin="dense"
                            error={bufError}
                            helperText={bufHelper}
                        />
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={handleEditClose}>取消</Button>
                        <Button onClick={handleEditSubmit}>确定</Button>
                    </DialogActions>
                </ProgressSlider>
            </Dialog>
            <DeleteAlertDialog
                targetName="评论"
                open={deleteDialog}
                onClose={() => setDeleteDialog(false)}
                onConfirm={handleDelete}
            />
        </>
    );
}

type ContextMenuProps = MenuProps & {
    isDeleting: boolean;
    onEdit: () => void;
    onDelete: () => void;
};

function CommentContextMenu({
    isDeleting,
    onDelete,
    onEdit,
    ...others
}: ContextMenuProps) {
    return (
        <Menu {...others}>
            <MenuItem onClick={onEdit}>
                <ListItemIcon>
                    <EditIcon />
                </ListItemIcon>
                编辑
            </MenuItem>
            <MenuItem onClick={onDelete}>
                <ListItemIcon>
                    {isDeleting ? (
                        <CircularProgress size="24px" />
                    ) : (
                        <DeleteIcon />
                    )}
                </ListItemIcon>
                删除
            </MenuItem>
        </Menu>
    );
}
