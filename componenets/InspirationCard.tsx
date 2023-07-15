import { Inspiration } from "../lib/db/inspiration";
import { useProfileContext } from "../lib/useUser";
import * as React from "react";
import { useEffect, useMemo, useState } from "react";
import { useRequestResult } from "../lib/useRequestResult";
import {
    CircularProgress,
    Menu,
    MenuItem,
    MenuList,
    MenuProps,
    Tooltip,
} from "@mui/material";
import { green, yellow } from "@mui/material/colors";
import ImplementedIcon from "@mui/icons-material/DoneAllOutlined";
import NotPlannedIcon from "@mui/icons-material/RemoveDoneOutlined";
import DeleteIcon from "@mui/icons-material/DeleteOutline";
import ArchiveIcon from "@mui/icons-material/ArchiveOutlined";
import UnarchiveIcon from "@mui/icons-material/UnarchiveOutlined";
import {
    getResponseRemark,
    hasPermission,
    reCaptchaNotReady,
} from "../lib/contract";
import { fetchApi } from "../lib/utility";
import { useGoogleReCaptcha } from "react-google-recaptcha-v3";
import { DeleteAlertDialog } from "./DeleteAlertDialog";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import { User } from "../lib/db/user";
import { ReviewCard, ReviewCardProps, ReviewCardRoot } from "./ReviewCard";

export interface RenderingInspiration extends Inspiration {
    raiserNick?: string | undefined;
}

interface InspirationCardProps extends ReviewCardProps<ContextMenuProps> {
    data: RenderingInspiration;
    onDeleted: () => void;
    onFlagChanged?: (flag: InspirationFlag) => void;
    onArchiveChanged?: (archived: boolean) => void;
}

export function InspirationCardRoot(
    props: InspirationCardProps & { fullWidth?: boolean },
): JSX.Element {
    const { data } = props;
    const [flag, setFlag] = React.useState(data.flag);
    const [archived, setArchived] = React.useState(data.archived);
    const { user } = useProfileContext();
    const canModify = useMemo(() => {
        if (!user) return false;
        return (
            hasPermission(user, "modify") ||
            (data.raiser === user._id && hasPermission(user, "edit_own_post"))
        );
    }, [user]);

    useEffect(() => {
        setFlag(data.flag);
    }, [data.flag]);
    useEffect(() => {
        setArchived(data.archived);
    }, [data.archived]);

    const marker = useMemo(() => {
        switch (flag) {
            case "implemented":
                return (
                    <Tooltip title="已实现">
                        <ImplementedIcon />
                    </Tooltip>
                );
            case "none":
                return undefined;
            case "not_planned":
                return (
                    <Tooltip title="不设计划">
                        <NotPlannedIcon />
                    </Tooltip>
                );
            case "sus":
                return "🤔";
        }
    }, [flag]);

    return (
        <ReviewCardRoot
            {...props}
            fullWidth={props.fullWidth}
            collectionId="inspirations"
            contextMenu={canModify ? ContextMenu : undefined}
            contextMenuProps={{
                data: data,
                flag: flag,
                archived: archived,
                onFlagChanged: (flag) => {
                    props.onFlagChanged?.call({}, flag);
                    setFlag(flag);
                },
                onArchiveChanged: (archived) => {
                    props.onArchiveChanged?.call({}, archived);
                    setArchived(archived);
                },
                onDeleted: props.onDeleted,
                user: user,
            }}
        >
            {marker}
            {archived && (
                <Tooltip title="已归档">
                    <ArchiveIcon />
                </Tooltip>
            )}
        </ReviewCardRoot>
    );
}

export function InspirationCard(props: InspirationCardProps): JSX.Element {
    const [flag, setFlag] = useState(props.data.flag);
    const colorProps = { backgroundColor: recommendedColorFor(flag) };
    return (
        <ReviewCard raiser={props.data.raiser} sx={colorProps}>
            <InspirationCardRoot {...props} />
        </ReviewCard>
    );
}

export function recommendedColorFor(flag: InspirationFlag): string {
    switch (flag) {
        case "not_planned":
            return yellow[800];
        case "implemented":
            return green[600];
        case "sus":
        case "none":
            return "inherit";
    }
}

type ContextMenuProps = MenuProps & {
    onArchiveChanged?: (newValue: boolean) => void;
    onDeleted: () => void;
    onFlagChanged?: (flag: InspirationFlag) => void;
    data: RenderingInspiration;
    user: User | undefined;
    flag: InspirationFlag;
    archived: boolean;
};

function ContextMenu(props: ContextMenuProps) {
    const { executeRecaptcha } = useGoogleReCaptcha();
    const [toDelete, setToDelete] = useState(false);
    const [processing, setProcessing] = useState("");

    const canModifyAll = useMemo(() => {
        if (!props.user) return false;
        return hasPermission(props.user, "modify");
    }, [props.user]);

    const handleDelRes = useRequestResult(props.onDeleted);
    const handleFlagRes = useRequestResult();
    const handleArchiveRes = useRequestResult(() => {
        props.onArchiveChanged?.call({}, !props.archived);
    });

    async function handleDelete() {
        if (processing === "delete") return;

        setProcessing("delete");
        if (executeRecaptcha) {
            const token = await executeRecaptcha();
            const res = await fetchApi(
                `/api/delete/inspirations/${props.data._id}`,
                { token },
            );
            const remark = await getResponseRemark(res);
            handleDelRes(remark);
        } else {
            handleDelRes(reCaptchaNotReady);
        }
        setProcessing("");
    }

    async function handleFlag(flag: InspirationFlag) {
        if (processing === flag) return;

        setProcessing(flag);
        if (executeRecaptcha) {
            const token = await executeRecaptcha();
            const newFlag = props.flag === flag ? "none" : flag;
            const res = await fetchApi(
                `/api/inspiration/${props.data._id}/${newFlag}`,
                { token },
            );
            const mark = await getResponseRemark(res);
            handleFlagRes(mark);

            if (mark.success) {
                props.onFlagChanged?.call({}, newFlag);
            }
        } else {
            handleFlagRes(reCaptchaNotReady);
        }
        props.onClose?.call({}, {}, "backdropClick");
        setProcessing("");
    }

    async function handleArchive() {
        if (processing === "archive") return;

        setProcessing("archive");
        if (executeRecaptcha) {
            const token = await executeRecaptcha();
            const res = await fetchApi(
                `/api/inspiration/${props.data._id}/${
                    props.archived ? "unarchive" : "archive"
                }`,
                { token },
            );
            const remark = await getResponseRemark(res);
            handleArchiveRes(remark);
        } else {
            handleArchiveRes(reCaptchaNotReady);
        }
        setProcessing("");
    }

    return (
        <>
            <Menu {...props}>
                <MenuList disablePadding>
                    <MenuItem onClick={() => setToDelete(true)}>
                        <ListItemIcon>
                            {processing === "delete" ? (
                                <Processing />
                            ) : (
                                <DeleteIcon />
                            )}
                        </ListItemIcon>
                        <ListItemText>删除</ListItemText>
                    </MenuItem>
                    <MenuItem onClick={handleArchive}>
                        <ListItemIcon>
                            {processing === "archive" ? (
                                <Processing />
                            ) : props.archived ? (
                                <UnarchiveIcon />
                            ) : (
                                <ArchiveIcon />
                            )}
                        </ListItemIcon>
                        <ListItemText>
                            {props.archived ? "取消归档" : "归档"}
                        </ListItemText>
                    </MenuItem>
                    {canModifyAll && (
                        <>
                            <MenuItem onClick={() => handleFlag("implemented")}>
                                <ListItemIcon>
                                    {processing === "implemented" ? (
                                        <Processing />
                                    ) : (
                                        <ImplementedIcon />
                                    )}
                                </ListItemIcon>
                                <ListItemText>实现</ListItemText>
                            </MenuItem>
                            <MenuItem onClick={() => handleFlag("not_planned")}>
                                <ListItemIcon>
                                    {processing === "not_planned" ? (
                                        <Processing />
                                    ) : (
                                        <NotPlannedIcon />
                                    )}
                                </ListItemIcon>
                                <ListItemText>不设计划</ListItemText>
                            </MenuItem>
                            <MenuItem onClick={() => handleFlag("sus")}>
                                <ListItemIcon>
                                    {processing === "sus" ? (
                                        <Processing />
                                    ) : (
                                        "🤔"
                                    )}
                                </ListItemIcon>
                                <ListItemText>这啥呀</ListItemText>
                            </MenuItem>
                        </>
                    )}
                </MenuList>
            </Menu>

            <DeleteAlertDialog
                targetName="灵感"
                open={toDelete}
                onConfirm={handleDelete}
                onClose={() => setToDelete(false)}
            />
        </>
    );
}

function Processing() {
    return <CircularProgress size="24px" />;
}
