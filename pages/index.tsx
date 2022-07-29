import type { NextPage } from "next";
import * as React from "react";
import Typography from "@mui/material/Typography";
import {
  Button,
  Card,
  CardContent,
  CardMedia,
  Collapse,
  CssBaseline,
  Divider,
  Grid,
  IconButton,
  IconButtonProps,
  styled,
  Box,
} from "@mui/material";
import PlaceHolder from "../componenets/PlaceHolder";
import { motion } from "framer-motion";

import NoRecentsIcon from "@mui/icons-material/WifiTetheringOff";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";

import styles from "../styles/Home.module.css";
import { getHumanReadableTime } from "../utility";
import { getRecents, Recent } from "../db/recent";

type PageProps = {
  recents: Recent[];
};

interface ExpandMoreProps extends IconButtonProps {
  expand: boolean;
}

const ExpandMore = styled((props: ExpandMoreProps) => {
  const { expand, ...other } = props;
  return <IconButton {...other} />;
})(({ theme, expand }) => ({
  transform: !expand ? "rotate(0deg)" : "rotate(180deg)",
  marginLeft: "auto",
  transition: theme.transitions.create("transform", {
    duration: theme.transitions.duration.shortest,
  }),
}));

function Subtitle(props: {children: React.ReactElement | string}) {
  return <Typography mb={1} variant="subtitle2">{props.children}</Typography>
}

function RecentCard(props: { data: Recent }): JSX.Element {
  const { data } = props;

  const [expanded, setExpanded] = React.useState(false);
  function handleExpansionClick() {
    setExpanded(!expanded);
  }

  return (
    <Card>
      <CardMedia
        component="img"
        height={140}
        sx={{ objectFit: "cover" }}
        alt="recent cover"
        image={"/api/images/" + data.cover}
      />

      <CardContent className={styles.cardContentSpec}>
        <Typography variant="body1" gutterBottom component="span" ml={2}>
          {data.title}
        </Typography>
        <ExpandMore
          onClick={handleExpansionClick}
          expand={expanded}
          aria-expanded={expanded}
          aria-label="more nonsense"
        >
          <ExpandMoreIcon />
        </ExpandMore>
      </CardContent>

      <Collapse in={expanded} timeout="auto" unmountOnExit>
        <Divider />
        <CardContent>
          <Typography variant="body2">{data.body}</Typography>
          <Typography variant="body2" color="text.secondary">
            <i>发布于{getHumanReadableTime(new Date(data.time))}</i>
          </Typography>
        </CardContent>
      </Collapse>
    </Card>
  );
}

function RecentCards(props: { data: Recent[] }): JSX.Element {
  const { data } = props;

  const subtitle = (
    <Subtitle>近况</Subtitle>
  );

  const [more, setMore] = React.useState(false);

  function handleShowMoreClick() {
    setMore(true);
  }

  if (data.length > 1) {
    return (
      <>
        {subtitle}
        <Grid
          container
          spacing={2}
          sx={{ display: { md: "flex", sm: "block", xs: "block" } }}
        >
          {data.map((e, i) =>
            i == 0 ? (
              <Grid item sx={{ flex: 1 }} key={i}>
                <RecentCard data={e} />
              </Grid>
            ) : (
              <>
              <Grid
                item
                sx={{flex: 1}}
                component={motion.div}
                key={i}
                variants={{
                  shown: { y: 0, opacity: 1, display: "block" },
                  hidden: { y: -10, opacity: 0, display: "none" },
                }}
                animate={more ? "shown" : "hidden"}
                transition={{ease: 'easeInOut', duration: 0.2, delay: 0.1}}
              >
                <RecentCard data={e} />
              </Grid>
              <Grid
                item
                sx={{flex: 1, display: more ? 'none' : {md: 'block', sm: 'none', xs: 'none'}}}
                key={'on-large-' + i}>
                  <RecentCard data={e} />
                </Grid>
              </>
            )
          )}
        </Grid>
        <Box
          sx={{
            display: { md: "none", sm: "flex", xs: "flex" },
            flexDirection: "row-reverse",
            mt: 1,
          }}
          component={motion.div}
          variants={{
            shown: { opacity: 1 },
            hidden: { opacity: 0 },
          }}
          animate={more ? "hidden" : "shown"}
          transition={{ duration: 0.2 }}
        >
          <Button variant="text" onClick={handleShowMoreClick}>
            更多
          </Button>
        </Box>
      </>
    );
  }
  if (data.length > 0) {
    return <RecentCard data={data[0]} />;
  } else {
    return (
      <>
        {subtitle}
        <PlaceHolder icon={NoRecentsIcon} title="未更新近况" />
      </>
    );
  }
}

function InspirationCards(): JSX.Element {
  const subtitle = <Subtitle>灵感</Subtitle>
  
  return <>

  </>
}

const Home: NextPage<PageProps> = ({ recents }) => {
  return (
    <>
      <RecentCards data={recents} />
    </>
  );
};

export async function getServerSideProps() {
  const recents = (await getRecents()).map((v) => {
    return { ...v, time: v.time.toISOString() };
  });
  return {
    props: {
      recents,
    },
  };
}

export default Home;
