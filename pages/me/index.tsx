import {NextPage} from "next";
import {useTitle} from "../../lib/useTitle";
import {MeHeader} from "../../componenets/MeHeader";
import {ReactNode, useEffect, useState} from "react";
import {User} from "../../lib/db/user";
import {lookupUser} from "../../lib/useUser";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

import QuestionIcon from "@mui/icons-material/HelpOutline";
import AnswerIcon from "@mui/icons-material/QuestionAnswerOutlined";
import Divider from "@mui/material/Divider";
import {useMediaQuery, useTheme} from "@mui/material";

const MePage: NextPage = () => {
    useTitle('关于我');
    const [user, setUser] = useState<User>();
    const theme = useTheme();
    const onLargeScreen = useMediaQuery(theme.breakpoints.up('sm'));

    useEffect(() => {
        lookupUser('zhufucdev').then(setUser);
    }, []);
    return <>
        <MeHeader user={user}/>
        <Stack sx={{width: '90%', ml: 'auto', mr: 'auto', mt: 4}}>
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
        </Stack>
    </>
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

export default MePage;