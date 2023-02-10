import {GetStaticProps, NextPage} from "next";
import {InspirationCardRoot, recommendedColorFor, RenderingInspiration} from "../../componenets/InspirationCard";
import {getInspirations} from "../../lib/db/inspiration";
import {getUsers} from "../../lib/db/user";
import {useTitle} from "../../lib/useTitle";
import PlaceHolder from "../../componenets/PlaceHolder";

import NoInspirationIcon from "@mui/icons-material/LightbulbOutlined";
import {Card, Grid} from "@mui/material";
import {useEffect, useState} from "react";
import {ReCaptchaScope} from "../../componenets/ReCaptchaScope";
import {motion} from "framer-motion";

const InspirationPage: NextPage<PageProps> = (props) => {
    useTitle('灵感');
    const [data, setData] = useState(props.data);

    if (data.length > 0) {
        return <ReCaptchaScope reCaptchaKey={props.reCaptchaKey}>
            <Grid container spacing={2} component={motion.div}>
                {
                    data.map(e =>
                        <Grid item key={e._id} flexGrow={1}>
                        <InspirationCard
                            data={e}
                            onDeleted={() => setData(data.filter(entry => entry._id !== e._id))}/>
                        </Grid>
                    )
                }
            </Grid>
        </ReCaptchaScope>
    } else {
        return <PlaceHolder icon={NoInspirationIcon} title="未提供灵感"/>
    }
}

function InspirationCard(props: { data: RenderingInspiration, onDeleted: () => void }) {
    const [flag, setFlag] = useState(props.data.flag);
    useEffect(() => {
        setFlag(props.data.flag)
    }, [props.data]);
    const color = recommendedColorFor(flag);
    return <Card variant="outlined" sx={{backgroundColor: color, minWidth: 300}}>
        <InspirationCardRoot
            data={props.data}
            onDeleted={props.onDeleted}
            onFlagChanged={setFlag}
        />
    </Card>
}

interface PageProps {
    data: RenderingInspiration[],
    reCaptchaKey: string
}

export const getStaticProps: GetStaticProps<PageProps> = async () => {
    const inspirations = await getInspirations();
    const users = await getUsers(inspirations.map(m => m.raiser));

    return {
        props: {
            data: inspirations.map(m => ({...m, raiserNick: users(m.raiser)?.nick})),
            reCaptchaKey: process.env.RECAPTCHA_KEY_FRONTEND as string
        }
    }
}

export default InspirationPage;