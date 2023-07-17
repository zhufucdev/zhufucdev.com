import {IronSession} from "iron-session";
import {withIronSessionApiRoute} from "iron-session/next";
import {NextApiHandler} from "next";
import {NextRequest, NextResponse} from "next/server";
import {getIronSession} from "iron-session/edge";
import {sessionConfig} from "./session.config";

declare module 'iron-session' {
    interface IronSessionData {
        userID?: UserID,
        accessToken?: TokenID
    }
}

export function routeWithIronSession(handler: NextApiHandler) {
    return withIronSessionApiRoute(handler, sessionConfig);
}

export async function optEdgeIronSession(req: NextRequest): Promise<IronSession> {
    return getIronSession(req, NextResponse.next(), sessionConfig);
}