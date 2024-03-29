import {IronSessionOptions} from "iron-session";

export const sessionConfig: IronSessionOptions = {
    password: process.env.SECRET_COOKIE_PASSWORD as string,
    cookieName: 'web-session',
    ttl: 2147483647,
    // secure: true should be used in production (HTTPS) but can't be used in development (HTTP)
    cookieOptions: {
        secure: process.env.NODE_ENV === 'production',
    },
}