import React from "react";
import {Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle} from "@mui/material";


interface AlertDialogProps {
    targetName: React.ReactNode;
    open: boolean;
    onClose?: () => void;
    onConfirm?: () => void;
    onCancel?: () => void;
}

export function DeleteAlertDialog(props: AlertDialogProps) {
    return <Dialog open={props.open} onClose={props.onClose}>
        <DialogTitle>
            正在删除 {props.targetName}
        </DialogTitle>
        <DialogContent>
            <DialogContentText>此操作无法撤销。继续？</DialogContentText>
        </DialogContent>
        <DialogActions>
            <Button
                color="inherit"
                onClick={() => {
                    props.onCancel?.call({});
                    props.onClose?.call({})
                }}>
                取消
            </Button>
            <Button
                color="error"
                onClick={() => {
                    props.onConfirm?.call({});
                    props.onClose?.call({});
                }}
            >删除</Button>
        </DialogActions>
    </Dialog>
}