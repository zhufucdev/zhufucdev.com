import {GetStaticProps, NextPage} from "next";
import {ArticleMeta, listArticles} from "../../lib/db/article";
import {
    Card,
    CardActionArea,
    CardContent,
    CardMedia,
    Grid,
    ListItemAvatar,
    useMediaQuery,
    useTheme
} from "@mui/material";
import {LazyImage} from "../../componenets/LazyImage";
import Typography from "@mui/material/Typography";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemButton from "@mui/material/ListItemButton";
import {UserAvatar} from "../../componenets/UserAvatar";
import ListItemText from "@mui/material/ListItemText";
import PlaceHolder from "../../componenets/PlaceHolder";

import NoArticleIcon from "@mui/icons-material/PsychologyOutlined";
import {Copyright} from "../../componenets/Copyright";

type PageProps = {
    articles: ArticleMeta[]
}

function ArticleCard(props: { data: ArticleMeta }): JSX.Element {
    const {data} = props;
    return (
        <Card variant="outlined">
            <CardActionArea>
                <CardMedia
                    component={LazyImage}
                    src={data.cover}
                    alt="文章封面"
                    style={{height: 140}}/>
                <CardContent>
                    <Typography variant="h5">{data.title}</Typography>
                    <Typography variant="body2" color="text.secondary">{data.forward}</Typography>
                </CardContent>
            </CardActionArea>
        </Card>
    )
}

function ArticleListItem(props: { data: ArticleMeta }): JSX.Element {
    const {data} = props;
    return (
        <ListItem>
            <ListItemButton>
                <ListItemAvatar>
                    <UserAvatar src={data.cover}/>
                </ListItemAvatar>
                <ListItemText
                    primary={data.title}
                    secondary={data.forward}/>
            </ListItemButton>
        </ListItem>
    )
}

const PostPage: NextPage<PageProps> = (props) => {
    const theme = useTheme();
    const onLargeScreen = useMediaQuery(theme.breakpoints.up('md'));

    if (props.articles.length <= 0) {
        return <>
            <PlaceHolder icon={NoArticleIcon} title="未提供文章"/>
            <Copyright/>
        </>
    }

    if (onLargeScreen) {
        return <>
            <Grid container spacing={2}>
                {props.articles.map(data => (
                    <Grid item key={data._id} sx={{flex: 1}}>
                        <ArticleCard data={data}/>
                    </Grid>
                ))}
            </Grid>
            <Copyright/>
        </>
    } else {
        return <>
            <List>
                {props.articles.map(data => <ArticleListItem data={data} key={data._id}/>)}
            </List>
            <Copyright/>
        </>
    }
}


export const getStaticProps: GetStaticProps<PageProps> = async () => {
    const articles = await listArticles();

    return {
        props: {
            articles
        }
    }
}

export default PostPage;