import {NextRequest, NextResponse} from "next/server";
import {fetchApi} from "./lib/utility";
import {hasPermission} from "./lib/contract";
import {getIronSession} from "iron-session/edge";
import {sessionConfig} from "./lib/session.config";
import {User} from "./lib/db/user";
import {Article} from "./lib/db/article";

function unauthorized(req: NextRequest) {
    return NextResponse.redirect(new URL('/unauthorized', req.url))
}

export async function lookup<T>(type: string, id: string, req: NextRequest): Promise<T | undefined> {
    const res = await fetch(new URL(`/api/${type}/${id}`, req.url));
    if (!res.ok) return undefined;
    return res.json()
}

export async function middleware(req: NextRequest) {
    const articleMatcher = /^.*\/article\/(.*)$/.exec(req.url);
    if (articleMatcher) {
        let id = articleMatcher[1];
        if (id.includes('/')) {
            id = id.split('/', 2)[0];
        }

        const article = await lookup<Article>('article', id, req);
        if (!article) return;

        const session = await getIronSession(req, NextResponse.next(), sessionConfig);
        if (!session.userID || !session.accessToken) {
            return unauthorized(req);
        }
        const {valid} = await (await fetchApi(new URL(`/api/user/verify`, req.url).toString(), {
            id: session.userID,
            token: session.accessToken
        })).json();
        if (!valid) {
            return unauthorized(req);
        }

        const user = await lookup<User>('user', session.userID, req);
        if (!user || !hasPermission(user, 'review') && article.author !== user._id) {
            return unauthorized(req);
        }
    }
}

export const config = {
    matcher: '/article/:id*'
}