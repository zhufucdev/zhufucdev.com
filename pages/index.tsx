import type {NextPage} from "next";
import * as React from "react";
import {useState} from "react";
import {Box, Button, Grid, Stack, Typography, useMediaQuery, useTheme} from "@mui/material";
import PlaceHolder from "../componenets/PlaceHolder";
import {motion} from "framer-motion";

import NoRecentsIcon from "@mui/icons-material/WifiTetheringOffOutlined";
import BulbIcon from "@mui/icons-material/LightbulbOutlined";
import EditIcon from '@mui/icons-material/Edit';
import {getRecents, Recent} from "../lib/db/recent";
import {getInspirations, Inspiration} from "../lib/db/inspiration";
import {Copyright} from "../componenets/Copyright";
import {Scaffold} from "../componenets/Scaffold";
import {DraftDialog} from "../componenets/DraftDialog";
import {InspirationCard} from "../componenets/InspirationCard";
import {RecentCard} from "../componenets/RecentCard";

const Home: NextPage<PageProps> = ({recents, inspirations, recaptchaKey}) => {
    const [draftOpen, setDraft] = useState(false);

    function handleNewPost(type: MessageType, id: string, raiser: UserID, content: MessageContent) {
        switch (type) {
            case "inspiration":
                inspirations.unshift({
                    _id: id,
                    raiser,
                    body: content.body,
                    likes: [],
                    implemented: false
                });
                break;
            case "recent":
                recents.pop();
                recents.unshift({
                    _id: id,
                    body: content.body,
                    title: content.title!,
                    cover: content.image!,
                    time: new Date().toISOString(),
                    likes: [],
                    dislikes: []
                });
        }
    }

    return (
        <>
            <Scaffold
                spacing={2}
                fab={
                    <>
                        <EditIcon sx={{mr: 1}}/>
                        草拟
                    </>
                }
                onFabClick={() => setDraft(true)}
            >
                <RecentCards key="recents" data={recents}/>
                <InspirationCards key="inspirations" data={inspirations}/>
            </Scaffold>
            <DraftDialog
                open={draftOpen}
                onClose={() => setDraft(false)}
                recaptchaKey={recaptchaKey}
                onPosted={handleNewPost}
            />
            <Copyright/>
        </>
    );
};

export type LocalRecent = Omit<Recent, "time"> & { time: string };

function Caption(props: { children: React.ReactElement | string }) {
    const theme = useTheme()
    return (
        <Typography mb={1} variant="subtitle2" color={theme.palette.primary.main}>
            {props.children}
        </Typography>
    );
}

function RecentCards(props: { data: LocalRecent[] }): JSX.Element {
    const {data} = props;
    const theme = useTheme();
    const onLargeScreen = useMediaQuery(theme.breakpoints.up('md'));

    const subtitle = <Caption key="subtitle-recents">近况</Caption>;

    const [more, setMore] = React.useState(false);

    function handleShowMoreClick() {
        setMore(true);
    }

    if (data.length > 1) {
        return (
            <Box>
                {subtitle}
                <Grid
                    container
                    spacing={2}
                    sx={{display: {md: "flex", sm: "block", xs: "block"}}}>
                    {data.map((e, i) =>
                        i == 0 ? (
                            <Grid item sx={{flex: 1}} key={e._id}>
                                <RecentCard data={e}/>
                            </Grid>
                        ) : (
                            onLargeScreen ?
                                <Grid
                                    item
                                    sx={{flex: 1}}
                                    key={e._id}
                                >
                                    <RecentCard data={e}/>
                                </Grid>
                                : <Grid
                                    item
                                    sx={{flex: 1}}
                                    component={motion.div}
                                    key={e._id}
                                    variants={{
                                        shown: {y: 0, opacity: 1, display: "block"},
                                        hidden: {y: -10, opacity: 0, display: "none"},
                                    }}
                                    animate={more ? "shown" : "hidden"}
                                    transition={{ease: "easeInOut", duration: 0.2}}
                                >
                                    <RecentCard data={e}/>
                                </Grid>
                        )
                    )}
                </Grid>
                <Box
                    sx={{
                        display: {md: "none", sm: "flex", xs: "flex"},
                        flexDirection: "row-reverse",
                        mt: 1,
                    }}
                    component={motion.div}
                    variants={{
                        shown: {opacity: 1},
                        hidden: {opacity: 0, display: "none"},
                    }}
                    animate={more ? "hidden" : "shown"}
                    transition={{duration: 0.2}}
                >
                    <Button variant="text" onClick={handleShowMoreClick}>
                        更多
                    </Button>
                </Box>
            </Box>
        );
    }
    if (data.length > 0) {
        return <RecentCard data={data[0]}/>;
    } else {
        return (
            <Box>
                {subtitle}
                <PlaceHolder icon={NoRecentsIcon} title="未更新近况"/>
            </Box>
        );
    }
}

function InspirationCards(props: { data: Inspiration[] }): JSX.Element {
    const {data} = props;
    const subtitle = <Caption key="subtitle-inspirations">灵感</Caption>;

    if (data.length > 0) {
        return (
            <Stack spacing={1}>
                {subtitle}
                {data.map((e) => (
                    <InspirationCard data={e} key={e._id}/>
                ))}
            </Stack>
        );
    } else {
        return (
            <Box>
                {subtitle}
                <PlaceHolder icon={BulbIcon} title="未提供灵感"/>
            </Box>
        );
    }
}

type PageProps = {
    recents: LocalRecent[];
    inspirations: Inspiration[];
    recaptchaKey: string;
};

export async function getServerSideProps(): Promise<{ props: PageProps }> {
    const recents = (await getRecents()).map((v) => {
        return {...v, time: v.time.toISOString(), likes: v.likes ?? [], dislikes: v.dislikes ?? []};
    });
    const inspirations = await getInspirations();

    return {
        props: {
            recents,
            inspirations,
            recaptchaKey: process.env.RECAPTCHA_KEY_FRONTEND as string
        },
    };
}

export default Home;
