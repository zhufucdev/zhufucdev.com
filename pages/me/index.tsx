import {GetServerSideProps, NextPage} from "next";
import {useTitle} from "../../lib/useTitle";
import {getUser} from "../../lib/db/user";
import {MeTabs} from "./[id]/[section]";
import {fromSafeUser, getSafeUser, SafeUser} from "../../lib/getSafeUser";
import {MeHeader} from "../../componenets/MeHeader";

const MePage: NextPage<PageProps> = (props) => {
    useTitle('关于我');
    return <>
        <MeHeader user={fromSafeUser(props.user)}/>
        <MeTabs section="qna" owner={props.user}/>
    </>
}

type PageProps = {
    user: SafeUser
};

export const getServerSideProps: GetServerSideProps<PageProps> = async () => {
    const me = await getUser('zhufucdev');
    return {
        props: {
            user: getSafeUser(me!)
        }
    }
}

export default MePage;