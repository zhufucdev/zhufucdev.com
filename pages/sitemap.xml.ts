import {GetServerSideProps} from "next";
import {ArticleMeta, listArticles} from "../lib/db/article";

const SITE_URL = "https://zhufucdev.com"

function generateSitemap(posts: ArticleMeta[]): string {
    return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${posts.map(meta => `<url><loc>${SITE_URL}/article/${meta._id}</loc></url>`).join('\n')}
</urlset>
    `
}

export const getServerSideProps: GetServerSideProps = async ({res}) => {
    const articles = await listArticles();
    const sitemap = generateSitemap(articles);
    res.setHeader('Content-Type', 'text/xml');
    res.write(sitemap);
    res.end();

    return {
        props: {}
    }
}

function SiteMap() {

}

export default SiteMap;