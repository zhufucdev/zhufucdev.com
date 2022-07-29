import type { NextPage } from "next";
import * as React from "react";
import Typography from "@mui/material/Typography";
import {
  Button,
  Card,
  CardContent,
  CardMedia,
  Collapse,
  Divider,
  Grid,
  IconButton,
  IconButtonProps,
  styled,
  Box,
  Skeleton,
  Avatar,
  Stack,
  CardActions,
} from "@mui/material";
import PlaceHolder from "../componenets/PlaceHolder";
import { motion } from "framer-motion";

import NoRecentsIcon from "@mui/icons-material/WifiTetheringOffOutlined";
import ExpandMoreIcon from "@mui/icons-material/ExpandMoreOutlined";
import BulbIcon from "@mui/icons-material/LightbulbOutlined";
import NoAccountsIcon from "@mui/icons-material/NoAccountsOutlined";
import LikeIcon from "@mui/icons-material/Favorite";
import ImplementedIcon from "@mui/icons-material/DoneAllOutlined";

import styles from "../styles/Home.module.css";
import { orange, green } from "@mui/material/colors";

import { cacheImage, getHumanReadableTime, getImageUri } from "../utility";
import { getRecents, Recent } from "../db/recent";
import { getInspirations, Inspiration } from "../db/inspiration";
import { getUser, User } from "../db/user";
import LoginPopover from "../componenets/LoginPopover";

type LocalRecent = Omit<Recent, "time"> & { time: string };
type LocalUser = Omit<User, "registerTime"> & { registerTime: string };
type LocalInspiration = Omit<Inspiration, "raiser"> & {
  raiser: LocalUser | null;
};

type PageProps = {
  recents: LocalRecent[];
  inspirations: LocalInspiration[];
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

function Subtitle(props: { children: React.ReactElement | string }) {
  return (
    <Typography mb={1} variant="subtitle2">
      {props.children}
    </Typography>
  );
}

function RecentCard(props: { data: LocalRecent }): JSX.Element {
  const { data } = props;
  const imageUri = getImageUri(data.cover);

  const [expanded, setExpanded] = React.useState(false);
  const [imageCached, setCached] = React.useState(false);

  function handleExpansionClick() {
    setExpanded(!expanded);
  }

  React.useEffect(() => {
    cacheImage(imageUri).then(() => setCached(true));
  });

  return (
    <Card>
      {imageCached ? (
        <CardMedia
          component="img"
          height={140}
          sx={{ objectFit: "cover" }}
          alt="recent cover"
          image={imageUri}
        />
      ) : (
        <Skeleton sx={{ height: 140 }} animation="wave" variant="rectangular" />
      )}

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

function RecentCards(props: { data: LocalRecent[] }): JSX.Element {
  const { data } = props;

  const subtitle = <Subtitle>近况</Subtitle>;

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
                  sx={{ flex: 1 }}
                  component={motion.div}
                  key={i}
                  variants={{
                    shown: { y: 0, opacity: 1, display: "block" },
                    hidden: { y: -10, opacity: 0, display: "none" },
                  }}
                  animate={more ? "shown" : "hidden"}
                  transition={{ ease: "easeInOut", duration: 0.2 }}
                >
                  <RecentCard data={e} />
                </Grid>
                <Grid
                  item
                  sx={{
                    flex: 1,
                    display: more
                      ? "none"
                      : { md: "block", sm: "none", xs: "none" },
                  }}
                  key={"on-large-" + i}
                >
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
            hidden: { opacity: 0, display: "none" },
          }}
          animate={more ? "hidden" : "shown"}
          transition={{ duration: 0.2 }}
        >
          <Button variant="text" onClick={handleShowMoreClick}>
            更多
          </Button>
        </Box>
      </Box>
    );
  }
  if (data.length > 0) {
    return <RecentCard data={data[0]} />;
  } else {
    return (
      <Box>
        {subtitle}
        <PlaceHolder icon={NoRecentsIcon} title="未更新近况" />
      </Box>
    );
  }
}

function InspirationCard(props: { data: LocalInspiration }): JSX.Element {
  const { data } = props;
  const imageUri = data.raiser ? getImageUri(data.raiser.avatar) : null;

  const [loaded, setLoaded] = React.useState(false);
  const [anchor, setAnchor] = React.useState<HTMLElement | null>(null);
  const popup = Boolean(anchor);

  function loginCheck(target: HTMLButtonElement): boolean {
    setAnchor(target);

    // TODO: Account System
    return false;
  }

  function handlePopoverClose() {
    setAnchor(null);
  }

  function handleLike(event: React.MouseEvent<HTMLButtonElement>) {
    if (!loginCheck(event.currentTarget)) {
      return;
    }
  }

  React.useEffect(() => {
    if (imageUri) cacheImage(imageUri).then(() => setLoaded(true));
  });

  return (
    <>
      <Grid container>
        <Grid item mr={1} ml={1}>
          {loaded ? (
            imageUri ? (
              <Avatar
                alt={"avatar of " + data.raiser!.nick}
                src={imageUri}
                style={{ width: 56, height: 56 }}
              />
            ) : (
              <Avatar sx={{ bgcolor: orange[900], width: 56, height: 56 }}>
                <NoAccountsIcon />
              </Avatar>
            )
          ) : (
            <Skeleton
              variant="circular"
              animation="wave"
              width={56}
              height={56}
            />
          )}
        </Grid>

        <Grid item flexGrow={1} mt={1}>
          <Card sx={data.implemented ? { backgroundColor: green[600] } : {}}>
            <CardContent sx={{ paddingBottom: 0 }}>{data.body}</CardContent>
            <CardActions>
              <Grid container ml={1}>
                <Grid item flexGrow={1}>
                  <Typography variant="body2" color="text.secondary">
                    {data.raiser?.nick}
                  </Typography>
                </Grid>
                <Grid item alignItems="center" sx={{ display: "flex" }}>
                  {data.implemented ? (
                    <ImplementedIcon aria-label="implemented" />
                  ) : null}
                  <IconButton aria-label="like" onClick={handleLike}>
                    <LikeIcon />
                  </IconButton>
                </Grid>
              </Grid>
            </CardActions>
          </Card>
        </Grid>
      </Grid>
      <LoginPopover
        open={popup}
        anchorEl={anchor}
        onClose={handlePopoverClose}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
      />
    </>
  );
}

function InspirationCards(props: { data: LocalInspiration[] }): JSX.Element {
  const { data } = props;
  const subtitle = <Subtitle>灵感</Subtitle>;

  if (data.length > 0) {
    return (
      <Stack spacing={1}>
        {subtitle}
        {data.map((e, i) => (
          <InspirationCard data={e} key={i} />
        ))}
      </Stack>
    );
  } else {
    return (
      <Box>
        {subtitle}
        <PlaceHolder icon={BulbIcon} title="未提供灵感" />
      </Box>
    );
  }
}

const Home: NextPage<PageProps> = ({ recents, inspirations }) => {
  return (
    <Stack spacing={2}>
      <RecentCards data={recents} />
      <InspirationCards data={inspirations} />
    </Stack>
  );
};

export async function getServerSideProps(): Promise<{ props: PageProps }> {
  const recents = (await getRecents()).map((v) => {
    return { ...v, time: v.time.toISOString() };
  });
  const inspirations = await (
    await getInspirations()
  ).map((v) => {
    return {
      ...v,
      raiser: v.raiser
        ? {
            ...v.raiser,
            registerTime: v.raiser.registerTime.toISOString(),
          }
        : null,
    };
  });
  return {
    props: {
      recents,
      inspirations,
    },
  };
}

export default Home;
