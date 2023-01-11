import React, {useCallback, useEffect, useState} from "react";
import {
    Box,
    Button,
    Card,
    CardActions,
    CardContent,
    Collapse,
    Fade,
    FilledInput,
    FormControl,
    FormHelperText,
    IconButton,
    InputLabel,
    LinearProgress,
    Stack,
    TextField,
    Tooltip,
    Typography
} from "@mui/material";
import type {NextPage} from "next";

import {Copyright} from "../componenets/Copyright";
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';

import styles from '../styles/Login.module.css';
import {fetchApi} from "../lib/utility";
import {useRouter} from "next/router";
import {GoogleReCaptchaProvider, useGoogleReCaptcha} from "react-google-recaptcha-v3";
import {userContract} from "../lib/contract";
import {useRequestResult} from "../lib/useRequestResult";
import {ReCaptchaPolicy} from "../componenets/ReCaptchaPolicy";

type Helper = { id?: string, pwd?: string, nick?: string, repwd?: string };
type UserInfo = { id: string, pwd: string, token: string, nick?: string, repwd?: string };
type LoginProps = { reCaptchaKey: string };

async function login(info: UserInfo): Promise<RequestResult> {
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

async function register(info: UserInfo): Promise<RequestResult> {
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

// Wrapping it as a separate component is because
// the useGoogleReCaptcha hook requires special context
function LoginUI() {
    const [showPwd, setShowPwd] = React.useState(false);
    const [loading, setLoading] = React.useState(false);
    const [registering, setRegistering] = React.useState(false);
    const [id, setId] = useState('');
    const [pwd, setPwd] = useState('');
    const [nick, setNick] = useState('');
    const [repwd, setRepwd] = useState('');

    const [helpers, setHelpers] = React.useState({id, pwd, nick, repwd} as Helper);
    const {executeRecaptcha} = useGoogleReCaptcha();
    const handleResult = useRequestResult(
        () => router.push('/'),
        () => setLoading(false)
    );
    const router = useRouter();

    const actionLogin = "登录", actionRegister = "注册";

    const handleRecaptchaVerify = useCallback(async () => {
        if (!executeRecaptcha) return;
        return await executeRecaptcha();
    }, [executeRecaptcha]);

    function updateHelpers(obj: Helper) {
        setHelpers({
            ...helpers,
            ...obj
        });
    }

    function testRepwd(repwd: string): boolean {
        return pwd === repwd;
    }

    function handleVisibilityToggle() {
        setShowPwd(!showPwd);
    }

    function handleSecondaryClick() {
        setRegistering(!registering);
    }

    async function handleContinue() {
        setLoading(true);
        const token = await handleRecaptchaVerify();

        const snapshot = {id, nick, pwd, repwd, token} as UserInfo;
        if (!snapshot.token) return;
        if (!userContract.testID(snapshot.id) || !userContract.testPwd(snapshot.pwd)) return;
        if (!snapshot.nick) snapshot.nick = snapshot.id;
        if (registering
            && (snapshot.repwd === undefined || !testRepwd(snapshot.repwd) || !userContract.testNick(snapshot.nick)))
            return;

        let res: RequestResult;
        if (registering) {
            res = await register(snapshot);
        } else {
            res = await login(snapshot);
        }
        handleResult(res);
    }

    useEffect(() => {
        if (registering && !userContract.testID(id)) {
            updateHelpers({id: "名称不可用"});
        } else {
            updateHelpers({id: ''});
        }
    }, [id]);

    useEffect(() => {
        if (registering && pwd.length < 4) {
            updateHelpers({pwd: "短密码不可用"})
        } else if (registering && !userContract.testPwd(pwd)) {
            updateHelpers({pwd: "需要数字和字母组合的密码"})
        } else {
            updateHelpers({pwd: ''})
        }
    }, [pwd]);

    useEffect(() => {
        if (!userContract.testNick(nick)) {
            updateHelpers({nick: "名称不可用"})
        } else {
            updateHelpers({nick: ''})
        }
    }, [nick])

    useEffect(() => {
        if (!testRepwd(repwd)) {
            updateHelpers({repwd: "重复密码不一致"})
        } else {
            updateHelpers({repwd: ''})
        }
    }, [repwd]);

    return (
        <>
            <Typography variant="h5" sx={{marginBottom: 2}}>欢迎回来，我的朋友</Typography>
            <Card variant="outlined">
                <Fade in={loading} style={{transitionDelay: "400ms"}}>
                    <LinearProgress variant="indeterminate"/>
                </Fade>
                <CardContent component={Stack} spacing={2} className={styles.pWithoutBottom}>
                    <TextField
                        variant="filled"
                        fullWidth
                        value={id}
                        onChange={(e) => setId(e.currentTarget.value)}
                        error={Boolean(helpers.id)}
                        label="用户名"
                        helperText={helpers.id}
                        disabled={loading}/>

                    <Collapse in={registering}>
                        <TextField
                            variant="filled"
                            fullWidth
                            value={nick}
                            onChange={(e) => setNick(e.currentTarget.value)}
                            label="昵称"
                            error={Boolean(helpers.nick)}
                            helperText={nick ? helpers.nick : "将与用户名同步"}
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
                            value={pwd}
                            onChange={(e) => setPwd(e.currentTarget.value)}
                            endAdornment={<Fade in={!registering}>
                                <IconButton onClick={handleVisibilityToggle}>
                                    {showPwd ? <VisibilityIcon/> : <VisibilityOffIcon/>}
                                </IconButton>
                            </Fade>}/>
                        <FormHelperText>{helpers.pwd}</FormHelperText>
                    </FormControl>

                    <Collapse in={registering}>
                        <TextField
                            variant="filled"
                            fullWidth
                            type="password"
                            value={repwd}
                            onChange={(e) => setRepwd(e.currentTarget.value)}
                            error={Boolean(helpers.repwd)}
                            label="重复密码"
                            disabled={loading}
                            helperText={helpers.repwd}/>
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
            <ReCaptchaPolicy variant="body2" sx={{textAlign: 'center'}}/>
            <Copyright marginTop={1}/>
        </>)
}

const Login: NextPage<LoginProps> = ({reCaptchaKey}) => {
    return <GoogleReCaptchaProvider
        reCaptchaKey={reCaptchaKey}
        language="zh-CN"
        useRecaptchaNet={true}
        scriptProps={{appendTo: 'body'}}>
        <LoginUI/>
    </GoogleReCaptchaProvider>
};

export default Login;

export function getServerSideProps(): { props: LoginProps } {
    return {
        props: {
            reCaptchaKey: process.env.RECAPTCHA_KEY_FRONTEND as string
        }
    }
}