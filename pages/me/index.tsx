import {GetStaticProps, NextPage} from "next";
import {useTitle} from "../../lib/useTitle";
import {getUser} from "../../lib/db/user";
import {fromSafeUser, getSafeUser, SafeUser} from "../../lib/safeUser";
import {MeHeader} from "../../components/MeHeader";
import {MeTabs} from "./[...param]";
import {myId} from "../../lib/useUser";
import {ReCaptchaScope} from "../../components/ReCaptchaScope";
import {ReCaptchaPolicy} from "../../components/ReCaptchaPolicy";
import {Copyright} from "../../components/Copyright";

const MePage: NextPage<PageProps> = (props) => {
    useTitle(`关于 ${props.user.nick}`);
    return <ReCaptchaScope reCaptchaKey={props.reCaptchaKey}>
        <MeHeader user={fromSafeUser(props.user)}/>
        <MeTabs section="qna" owner={props.user}/>
        <ReCaptchaPolicy sx={{textAlign: "center"}}/>
        <Copyright/>
    </ReCaptchaScope>
}

type PageProps = {
    user: SafeUser,
    reCaptchaKey: string
};

export const getStaticProps: GetStaticProps<PageProps> = async () => {
    const reCaptchaKey = process.env.RECAPTCHA_KEY_FRONTEND as string;
    const me = await getUser(myId);
    return {
        props: {
            user: getSafeUser(me!),
            reCaptchaKey
        }
    }
}

export default MePage;
