import React, {useCallback, useMemo} from "react";
import {
    Alert,
    Box,
    Button,
    Card, CardActions,
    CardContent, Collapse, Fade,
    FilledInput,
    FormControl, FormHelperText,
    FormLabel, IconButton, InputLabel,
    LinearProgress, Snackbar,
    Stack,
    TextField, Tooltip,
    Typography
} from "@mui/material";
import type {NextPage} from "next";

import {Copyright} from "../componenets/Copyright";
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';

import styles from '../styles/Login.module.css';
import {info} from "next/dist/build/output/log";
import {fetchApi} from "../lib/utility";
import {useRouter} from "next/router";

type HelperType = { id?: string, pwd?: string, nick?: string, repwd?: string }
type InfoType = { id: string, pwd: string, nick?: string, repwd?: string }
type Result = { success: boolean, respond?: string, msg?: string }

async function login(info: InfoType): Promise<Result> {
    const res = await fetchApi('/api/login', info);
    switch (res.status) {
        case 400:
            return {
                success: false,
                respond: await res.text(),
                msg: "bug"
            }
        case 401:
            return {
                success: false,
                respond: await res.text(),
                msg: "密码不匹配"
            }
        case 200:
            return {success: true}
        default:
            return {
                success: false,
                respond: await res.text(),
                msg: "咋回事儿？"
            }
    }
}

async function register(info: InfoType): Promise<Result> {
    delete info.repwd;
    const res = await fetchApi('/api/register', info);
    switch (res.status) {
        case 400:
            return {
                success: false,
                respond: await res.text(),
                msg: "bug"
            }
        case 409:
            return {
                success: false,
                respond: await res.text(),
                msg: "用户名重复"
            }
        case 200:
            return {success: true}
        default:
            return {
                success: false,
                respond: await res.text(),
                msg: "咋回事儿？"
            }
    }
}

const Login: NextPage = () => {
    const [showPwd, setShowPwd] = React.useState(false);
    const [loading, setLoading] = React.useState(false);
    const [registering, setRegistering] = React.useState(false);
    const [info, setInfo] = React.useState({
        id: '', pwd: '', repwd: ''
    } as InfoType);
    const [helpers, setHelpers] = React.useState(info as HelperType);
    const [snackbar, setSnackbar] = React.useState('');
    const router = useRouter();

    const actionLogin = "登录", actionRegister = "注册";

    function updateHelpers(obj: HelperType) {
        setHelpers({
            ...helpers,
            ...obj
        });
    }

    function testID(id: string): boolean {
        if (id === 'undefined') return false
        const idScheme = /^[a-zA-Z0-9_-]{3,15}$/;
        return idScheme.test(id);
    }

    function testPwd(pwd: string): boolean {
        const pwdScheme = /([a-zA-Z]+)|([0-9]+)/g;
        const matches = pwd.matchAll(pwdScheme);
        let count = 0;
        while (!matches.next().done) {
            count++;
        }
        return count >= 2;
    }

    function testNick(nick: string): boolean {
        const illegal = /[*·$()（）「」【】/|\\@《》<>]/;
        return !illegal.test(nick);
    }

    function testRepwd(repwd: string): boolean {
        return info.pwd === repwd;
    }

    function handleVisibilityToggle() {
        setShowPwd(!showPwd);
    }

    function handleSecondaryClick() {
        setRegistering(!registering);
    }

    function handleSnackbarClose() {
        setSnackbar('');
    }

    async function handleContinue() {
        const snapshot = {...info};
        if (!testID(snapshot.id) || !testPwd(snapshot.pwd)) return;
        if (!snapshot.nick) snapshot.nick = snapshot.id;
        if (registering
            && (snapshot.repwd === undefined || !testRepwd(snapshot.repwd) || !testNick(snapshot.nick)))
            return;

        setLoading(true);
        let res: Result;
        if (registering) {
            res = await register(snapshot);
        } else {
            res = await login(snapshot);
        }
        if (!res.success) {
            if (res.respond) {
                if (res.msg) {
                    setSnackbar(`${res.msg} (${res.respond})`);
                } else {
                    setSnackbar(res.msg as string);
                }
            } else {
                setSnackbar("未知错误");
            }
            setLoading(false);
        } else {
            await router.push('/');
        }
    }

    function handleUserIDChange(event: React.ChangeEvent<HTMLInputElement>) {
        const id = event.currentTarget.value;
        setInfo({...info, id});
        if (registering && !testID(id)) {
            updateHelpers({id: "名称不可用"});
        } else {
            updateHelpers({id: ''});
        }
    }

    function handlePwdChange(event: React.ChangeEvent<HTMLInputElement>) {
        const pwd = event.currentTarget.value;
        setInfo({...info, pwd});
        if (registering && pwd.length < 4) {
            updateHelpers({pwd: "短密码不可用"})
        } else if (registering && !testPwd(pwd)) {
            updateHelpers({pwd: "需要数字和字母组合的密码"})
        } else {
            updateHelpers({pwd: ''})
        }
    }

    function handleNickChange(event: React.ChangeEvent<HTMLInputElement>) {
        const nick = event.currentTarget.value
        setInfo({...info, nick});
        if (!testNick(nick)) {
            updateHelpers({nick: "名称不可用"})
        } else {
            updateHelpers({nick: ''})
        }
    }

    function handleRepwdChange(event: React.ChangeEvent<HTMLInputElement>) {
        const repwd = event.currentTarget.value;
        setInfo({...info, repwd});
        if (!testRepwd(repwd)) {
            updateHelpers({repwd: "重复密码不一致"})
        } else {
            updateHelpers({repwd: ''})
        }
    }

    return <>
        <Typography variant="h5" sx={{marginBottom: 2}}>欢迎回来，我的朋友</Typography>
        <Card variant="outlined">
            <Fade in={loading} style={{transitionDelay: "800ms"}}>
                <LinearProgress variant="indeterminate"/>
            </Fade>
            <CardContent component={Stack} spacing={2} className={styles.pWithoutBottom}>
                <TextField
                    variant="filled"
                    fullWidth
                    error={Boolean(helpers.id)}
                    label="用户名"
                    helperText={helpers.id}
                    onChange={handleUserIDChange}
                    disabled={loading}/>

                <Collapse in={registering}>
                    <TextField
                        variant="filled"
                        fullWidth
                        label="昵称"
                        error={Boolean(helpers.nick)}
                        helperText={info.nick ? helpers.nick : "将与用户名同步"}
                        onChange={handleNickChange}
                        disabled={loading}/>
                </Collapse>

                <FormControl
                    variant="filled"
                    fullWidth
                    error={Boolean(helpers.pwd)}
                    disabled={loading}>
                    <InputLabel htmlFor="input-pwd">密码</InputLabel>
                    <FilledInput
                        id="input-pwd"
                        type={showPwd && !registering ? "text" : "password"}
                        endAdornment={
                            <Fade in={!registering}>
                                <IconButton onClick={handleVisibilityToggle}>
                                    {showPwd ? <VisibilityIcon/> : <VisibilityOffIcon/>}
                                </IconButton>
                            </Fade>
                        }
                        onChange={handlePwdChange}/>
                    <FormHelperText>{helpers.pwd}</FormHelperText>
                </FormControl>

                <Collapse in={registering}>
                    <TextField
                        variant="filled"
                        fullWidth
                        type="password"
                        error={Boolean(helpers.repwd)}
                        label="重复密码"
                        disabled={loading}
                        helperText={helpers.repwd}
                        onChange={handleRepwdChange}/>
                </Collapse>
            </CardContent>
            <CardActions className={styles.pWithoutTop}>
                <Button onClick={handleSecondaryClick}
                        disabled={loading}>
                    {registering ? actionLogin : actionRegister}
                </Button>
                <Box sx={{marginLeft: 'auto'}}>
                    <Tooltip title={registering ? actionRegister : actionLogin}>
                        <IconButton
                            onClick={handleContinue}
                            disabled={loading}>
                            <ArrowForwardIcon/>
                        </IconButton>
                    </Tooltip>
                </Box>
            </CardActions>
        </Card>
        <Snackbar open={Boolean(snackbar)}
                  onClose={handleSnackbarClose}
                  anchorOrigin={{vertical: "bottom", horizontal: "right"}}>
            <Alert onClose={handleSnackbarClose} severity="error" sx={{width: '100%'}}>
                {snackbar}
            </Alert>
        </Snackbar>
        <Copyright/>
    </>
};

export default Login;
