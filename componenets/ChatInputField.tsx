import { useEffect, useState } from "react";
import Paper, { PaperProps } from "@mui/material/Paper";
import {
    CircularProgress,
    IconButton,
    InputBase,
} from "@mui/material";
import SendIcon from "@mui/icons-material/SendOutlined";
import { styled } from "@mui/material/styles";

interface ContainerProps extends PaperProps {
    revealed: boolean;
    fullWidth?: boolean;
    revealingStart: string;
    error?: boolean;
}

interface Props extends ContainerProps {
    value: string;
    onValueChanged: (newValue: string) => void;
    autoFocus?: boolean;
    sendDisabled?: boolean;
    onBlur?: () => void;
    isSending?: boolean;
    onSend?: () => void;
}

const Container = styled((props: ContainerProps) => {
    const { revealed, fullWidth, revealingStart, error, ...others } = props;
    return <Paper {...others} />;
})(({ theme, revealed, fullWidth, revealingStart, error }) => ({
    display: "flex",
    alignItems: "center",
    width: fullWidth ? "100%" : undefined,
    background: error
        ? theme.palette.error.main
        : theme.palette.mode === "dark"
        ? theme.palette.grey["800"]
        : theme.palette.grey["300"],

    borderRadius: "42px",
    paddingLeft: "16px",
    clipPath: revealed
        ? `circle(150% at ${revealingStart})`
        : `circle(0px at ${revealingStart})`,
    transition: theme.transitions.create("clip-path", {
        duration: theme.transitions.duration.short,
    }),
}));

export function ChatInputField(props: Props) {
    const [focus, setFocus] = useState("");

    function handleFocus(name: string) {
        return () => {
            setFocus(name);
        };
    }

    function handleBlur(name: string) {
        return () => {
            if (focus === name) {
                setFocus("");
            }
        };
    }

    useEffect(() => {
        if (!focus) {
            setTimeout(() => {
                if (!focus) {
                    props.onBlur?.call({});
                }
            }, 100);
        }
    }, [focus]);

    return (
        <Container
            elevation={0}
            fullWidth={props.fullWidth}
            revealingStart={props.revealingStart}
            revealed={props.revealed}
            onBlur={handleBlur("ct")}
            onFocus={handleFocus("ct")}
            error={props.error}
            sx={props.sx}
        >
            <InputBase
                fullWidth={props.fullWidth}
                sx={{ flexGrow: 1 }}
                value={props.value}
                onChange={(ev) => props.onValueChanged(ev.currentTarget.value)}
                onBlur={handleBlur("tf")}
                onFocus={handleBlur("tf")}
                autoFocus={props.autoFocus}
            />
            {props.isSending ? (
                <CircularProgress
                    size={32}
                    sx={{ m: "4px" }}
                    onFocus={handleBlur("pgr")}
                    onBlur={handleBlur("pgr")}
                />
            ) : (
                <IconButton
                    onClick={() => {
                        props.onSend?.call({});
                        handleFocus("btn")();
                    }}
                    disabled={props.sendDisabled}
                >
                    <SendIcon />
                </IconButton>
            )}
        </Container>
    );
}
