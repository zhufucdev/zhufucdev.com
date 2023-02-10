import type {NextPage} from "next";
import * as React from "react";
import {useState} from "react";
import {
    Box,
    Button,
    Grid,
    Stack,
    Typography,
    TypographyProps,
    useMediaQuery,
    useTheme
} from "@mui/material";
import {AnimatePresence, motion} from "framer-motion";
import NoRecentsIcon from "@mui/icons-material/WifiTetheringOffOutlined";
import BulbIcon from "@mui/icons-material/LightbulbOutlined";
import EditIcon from "@mui/icons-material/Edit";
import ContinueIcon from "@mui/icons-material/ArrowForward";

import {getRecents, Recent} from "../lib/db/recent";
import {getInspirations} from "../lib/db/inspiration";
import PlaceHolder from "../componenets/PlaceHolder";
import {Copyright} from "../componenets/Copyright";
import {Scaffold} from "../componenets/Scaffold";
import {DraftDialog} from "../componenets/DraftDialog";
import {InspirationCard, RenderingInspiration} from "../componenets/InspirationCard";
import {RecentCard} from "../componenets/RecentCard";
import {useTitle} from "../lib/useTitle";
import {getUsers, User} from "../lib/db/user";
import {ReCaptchaScope} from "../componenets/ReCaptchaScope";
import {ReCaptchaPolicy} from "../componenets/ReCaptchaPolicy";
import Link from "next/link";

const Home: NextPage<PageProps> = ({recents, inspirations: _inspirations, recaptchaKey}) => {
    const [draftOpen, setDraft] = useState(false);
    useTitle('主页');

    const [inspirations, setInspirations] = useState(_inspirations);

    function handleNewPost(type: MessageType, id: string, raiser: User, content: MessageContent) {
        switch (type) {
            case "inspiration":
                inspirations.unshift({
                    _id: id,
                    raiser: raiser._id,
                    body: content.body,
                    likes: [],
                    flag: 'none',
                    archived: false,
                    comments: [],
                    raiserNick: raiser.nick
                });
                setInspirations(inspirations);
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
        <ReCaptchaScope reCaptchaKey={recaptchaKey}>
            <Scaffold
                spacing={2}
                fabContent={
                    <>
                        <EditIcon sx={{mr: 1}}/>
                        草拟
                    </>
                }
                onFabClick={() => setDraft(true)}
            >
                <RecentCards key="recents" data={recents}/>
                <InspirationCards key="inspirations" data={inspirations} setData={setInspirations}/>
            </Scaffold>
            <DraftDialog
                open={draftOpen}
                onClose={() => setDraft(false)}
                onPosted={handleNewPost}
            />
            <ReCaptchaPolicy sx={{textAlign: 'center'}}/>
            <Copyright/>
        </ReCaptchaScope>
    );
};

export type LocalRecent = Omit<Recent, "time"> & { time: string };

function Caption(props: TypographyProps) {
    const theme = useTheme()
    return (
        <Typography mb={1} variant="subtitle2" color={theme.palette.primary.main} {...props}>
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

function InspirationCards(props: { data: RenderingInspiration[], setData: (value: RenderingInspiration[]) => void }): JSX.Element {
    const {data, setData} = props;

    if (data.length > 0) {
        return (
            <Stack spacing={1} component={motion.div} layout sx={{overflowX: 'hidden'}}>
                <Caption key="subtitle-inspirations">灵感</Caption>
                <AnimatePresence initial={false}>
                    {data.map((e) => (
                        <motion.div
                            key={e._id}
                            animate={{x: 0}}
                            exit={{x: '100%', height: 0}}
                        >
                            <InspirationCard
                                data={e}
                                onDeleted={() => setData(data.filter(en => en._id !== e._id))}
                                onArchiveChanged={
                                    (archived) => archived && setData(data.filter(en => en._id !== e._id))
                                }
                            />
                        </motion.div>
                    ))}
                </AnimatePresence>
                <Box display="flex" flexDirection="row-reverse">
                    <Button variant="text" component={Link} href="/inspiration">
                        所有灵感 <ContinueIcon/>
                    </Button>
                </Box>
            </Stack>
        );
    } else {
        return (
            <Box>
                <Caption key="subtitle-inspirations">灵感</Caption>
                <PlaceHolder icon={BulbIcon} title="未提供灵感"/>
            </Box>
        );
    }
}

type PageProps = {
    recents: LocalRecent[];
    inspirations: RenderingInspiration[];
    recaptchaKey: string;
};

type StaticProps = {
    props: PageProps,
    revalidate: number | boolean
}

export async function getStaticProps(): Promise<StaticProps> {
    const recents = (await getRecents()).map((v) => ({...v, time: v.time.toISOString()}));
    const inspirations = await getInspirations();
    const unfoldedInspirations: RenderingInspiration[] = [];
    const users = await getUsers(inspirations.map(m => m.raiser));
    for (const meta of inspirations) {
        if (meta.archived) continue;
        const user = users(meta.raiser);
        if (user)
            unfoldedInspirations.push({
                ...meta,
                raiserNick: user.nick
            })
        else
            unfoldedInspirations.push(meta)
    }
    return {
        props: {
            recents,
            inspirations: unfoldedInspirations,
            recaptchaKey: process.env.RECAPTCHA_KEY_FRONTEND as string
        },
        revalidate: false
    };
}

export default Home;
