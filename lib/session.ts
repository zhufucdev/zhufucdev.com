import {IronSessionOptions} from "iron-session";
import {withIronSessionApiRoute} from "iron-session/next";
import {NextApiHandler} from "next";

export const sessionOptions: IronSessionOptions = {
    password: process.env.SECRET_COOKIE_PASSWORD as string,
    cookieName: 'web-session',
    ttl: 2147483647,
    // secure: true should be used in production (HTTPS) but can't be used in development (HTTP)
    cookieOptions: {
        secure: process.env.NODE_ENV === 'production',
    },
}

declare module 'iron-session' {
    interface IronSessionData {
        userID?: UserID,
        accessToken?: TokenID
    }
}

export function routeWithIronSession(handler: NextApiHandler) {
    return withIronSessionApiRoute(handler, sessionOptions);
}
