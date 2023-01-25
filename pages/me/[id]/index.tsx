import {GetServerSideProps, NextPage} from "next";
import {fromSafeUser, getSafeUser, SafeUser} from "../../../lib/getSafeUser";
import {MeHeader} from "../../../componenets/MeHeader";
import {MeTabs, NoUserHint} from "./[section]";
import {useRouter} from "next/router";
import {getInspirations, Inspiration} from "../../../lib/db/inspiration";
import {getUser} from "../../../lib/db/user";
import {useTitle} from "../../../lib/useTitle";
import {isMe} from "../../../lib/useUser";
import {GoogleReCaptchaProvider} from "react-google-recaptcha-v3";

type PageProps = {
    owner?: SafeUser,
    inspirations?: Inspiration[],
    reCaptchaKey: string
}

const DefaultMePage : NextPage<PageProps> = (props) => {
    const router = useRouter();
    const {id} = router.query;
    const [, setTitle] = useTitle();

    if (props.owner) {
        const user = fromSafeUser(props.owner);
        if (isMe(user)) {
            setTitle("关于我");
        } else {
            setTitle(`关于${user.nick}`);
        }

        return <GoogleReCaptchaProvider reCaptchaKey={props.reCaptchaKey}>
            <MeHeader user={user}/>
            <MeTabs owner={props.owner} inspirations={props.inspirations}/>
        </GoogleReCaptchaProvider>
    } else {
        return <NoUserHint id={id as string}/>
    }
};

export default DefaultMePage;

export const getServerSideProps: GetServerSideProps<PageProps> = async (context) => {
    const reCaptchaKey = process.env.RECAPTCHA_KEY_FRONTEND as string;
    const {id} = context.query;
    const user = (await getUser(id as string)) ?? undefined;
    if (user) {
        const inspirations = (await getInspirations()).filter(entry => entry.raiser === user._id);
        return {
            props: {
                owner: getSafeUser(user),
                inspirations, reCaptchaKey
            }
        }
    } else {
        return {props: {reCaptchaKey}}
    }
}