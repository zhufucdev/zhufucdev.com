import {GetStaticProps, NextPage} from "next";
import {useTitle} from "../../lib/useTitle";
import {getUser} from "../../lib/db/user";
import {MeTabs} from "./[id]/[section]";
import {fromSafeUser, getSafeUser, SafeUser} from "../../lib/getSafeUser";
import {MeHeader} from "../../componenets/MeHeader";
import {GoogleReCaptchaProvider} from "react-google-recaptcha-v3";

const MePage: NextPage<PageProps> = (props) => {
    useTitle('关于我');
    return <GoogleReCaptchaProvider reCaptchaKey={props.reCaptchaKey}>
        <MeHeader user={fromSafeUser(props.user)}/>
        <MeTabs section="qna" owner={props.user}/>
    </GoogleReCaptchaProvider>
}

type PageProps = {
    user: SafeUser,
    reCaptchaKey: string
};

export const getStaticProps: GetStaticProps<PageProps> = async () => {
    const reCaptchaKey = process.env.RECAPTCHA_KEY_FRONTEND as string;
    const me = await getUser('zhufucdev');
    return {
        props: {
            user: getSafeUser(me!),
            reCaptchaKey
        }
    }
}

export default MePage;