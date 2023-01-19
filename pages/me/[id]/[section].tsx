import {GetServerSideProps, NextPage} from "next";
import {Stack, Tab, Tabs, Box} from "@mui/material";
import {getInspirations, Inspiration} from "../../../lib/db/inspiration";
import {InspirationCardRoot} from "../../../componenets/InspirationCard";
import {useRouter} from "next/router";
import {MeHeader} from "../../../componenets/MeHeader";
import Typography from "@mui/material/Typography";
import Divider from "@mui/material/Divider";
import {ReactNode} from "react";
import {getUser} from "../../../lib/db/user";
import PlaceHolder from "../../../componenets/PlaceHolder";
import {fromSafeUser, getSafeUser, SafeUser} from "../../../lib/getSafeUser";
import QuestionIcon from "@mui/icons-material/HelpOutline";
import AnswerIcon from "@mui/icons-material/QuestionAnswerOutlined";
import ErrorIcon from "@mui/icons-material/ErrorOutline";
import NoInspirationIcon from "@mui/icons-material/LightbulbOutlined";
import NotImplementedIcon from "@mui/icons-material/HandymanOutlined";
import Link from "next/link";
import {isMe} from "../../../lib/useUser";
import {useTitle} from "../../../lib/useTitle";

function InspirationsTab(props: { data: Inspiration[] }): JSX.Element {
    const {data} = props;
    if (data.length > 0) {
        return <Stack>
            {data.map(
                (entry, index) => <Box key={entry._id}>
                    <InspirationCardRoot data={entry}/>
                    {index < data.length - 1 && <Divider/>}
                </Box>
            )}
        </Stack>
    } else {
        return <PlaceHolder icon={NoInspirationIcon} title="未提供灵感"/>
    }
}

function QnA(props: { question: ReactNode, answer: ReactNode }) {
    return <>
        <Stack direction="row" alignItems="center" mt={1}>
            <QuestionIcon sx={{m: 1}}/>
            {props.question}
        </Stack>
        <Stack direction="row" alignItems="center" mb={1}>
            <AnswerIcon sx={{m: 1}}/>
            {props.answer}
        </Stack>
    </>
}

function IssuesTab(): JSX.Element {
    return <PlaceHolder icon={NotImplementedIcon} title="提问暂未实现"/>
}

export function QnaTab(): JSX.Element {
    return <>
        <Typography variant="h4" ml={1}>Q&A</Typography>
        <QnA question="你是什么人" answer="我是个坏人，因为我从来不清理自己的代码"/>
        <Divider/>
        <QnA question="你的代码很酷，我怎么才能找到你" answer="你可以来我家找我，但要付钱，通常要付很多"/>
        <Divider/>
        <QnA question="你的代码怎么写得这么垃圾，根本没法用" answer="我不在乎，除非付给我钱"/>
        <Divider/>
        <QnA question="还会做什么"
             answer="我会做视频，比如整一些文案、动画，简单的调色、调音，还会3D建模，虽然不怎么会。此外，我还会使用Arch Linux"/>
        <Divider/>
        <QnA question="怎么评价你自己" answer="没啥好说的，就是牛逼"/>
        <Divider/>
        <QnA question="怎么评价XX事件" answer="我不在乎"/>
    </>
}

type TabProps = { section?: TraceType } & PageProps;
const display: { [key: string]: string } = {
    qna: 'Q&A',
    inspirations: '灵感',
    issues: '问题'
}

export function MeTabs(props: TabProps): JSX.Element {
    const tabs = ['inspirations', 'issues']
    const aboutMe = props.owner && isMe(props.owner._id);
    if (aboutMe) {
        tabs.unshift('qna');
    }
    const section = props.section ?? (aboutMe ? 'qna' : 'inspirations');
    const value = tabs.indexOf(section);
    let content: JSX.Element | undefined;
    switch (section) {
        case 'qna':
            if (aboutMe) {
                content = <QnaTab/>
            }
            break;
        case 'inspirations':
            content = <InspirationsTab data={props.inspirations!}/>
            break;
        case 'issues':
            content = <IssuesTab/>
            break;
    }

    return (
        <Stack sx={{width: '90%', ml: 'auto', mr: 'auto'}}>
            <Tabs value={value} sx={{mb: 4}}>
                {tabs.map(tab => <Tab key={tab} label={display[tab]} component={Link}
                                      href={`/me/${props.owner?._id}/${tab}`}/>)}
            </Tabs>
            {content}
        </Stack>
    )
}

export function NoUserHint(props: { id: UserID }): JSX.Element {
    return (
        <Box mt={4}>
            <PlaceHolder icon={ErrorIcon} title={"未找到用户" + props.id}/>
        </Box>
    )
}

const TabbedMePage: NextPage<PageProps> = (props) => {
    const router = useRouter();
    const {id, section} = router.query;
    const [, setTitle] = useTitle();
    if (props.owner) {
        if (isMe(props.owner._id)) {
            setTitle("关于我")
        } else {
            setTitle(`关于${props.owner.nick}`);
        }
        return <>
            <MeHeader user={fromSafeUser(props.owner)}/>
            <MeTabs section={section as TraceType} {...props}/>
        </>
    } else {
        return <NoUserHint id={id as string}/>
    }
};

type PageProps = {
    inspirations?: Inspiration[],
    owner?: SafeUser
}
export const getServerSideProps: GetServerSideProps<PageProps> = async (context) => {
    const {id} = context.query;
    const owner = (await getUser(id as string)) ?? undefined;
    let inspirations: Inspiration[] | undefined;
    if (owner) {
        inspirations = (await getInspirations()).filter(entry => entry.raiser == id);
        return {
            props: {owner: getSafeUser(owner), inspirations}
        }
    } else {
        return {props: {}}
    }
}

export default TabbedMePage;