import {Remarkable, RemarkMode} from "./db/remark";
import {User} from "./db/user";

export function getHumanReadableTime(time: Date): string {
    function prefix(units: number): string | undefined {
        switch (units) {
            case 1:
                return "昨";
            case 2:
                return "前";
            default:
                return undefined;
        }
    }

    function fix(num: number): string {
        if (num == 0) {
            return "00";
        } else if (num < 10) {
            return "0" + num;
        } else {
            return num.toString();
        }
    }

    const clock = fix(time.getHours()) + ":" + fix(time.getMinutes());
    const now = new Date();
    if (time.getFullYear() == now.getFullYear()) {
        if (time.getMonth() == now.getMonth()) {
            if (time.getDate() == now.getDate()) {
                // same day
                return clock;
            } else {
                const dateElasped = now.getDate() - time.getDate();
                const pre = prefix(dateElasped);
                if (pre) {
                    return `${pre}天`
                } else {
                    return `${dateElasped}天前`
                }
            }
        } else {
            return `${time.getMonth().toLocaleString("zh-CN")}月${time
                .getDate()
                .toLocaleString("zh-CN")}日 ${clock}`;
        }
    } else {
        const yearElasped = now.getFullYear() - time.getFullYear();
        return `${prefix(yearElasped) || time.getFullYear()}年${
            time.getMonth() + 1
        }月${time.getDate()}日 ${clock}`;
    }
}

const imageCache = new Map<string, boolean>();

export async function cacheImage(src: string) {
    if (src in imageCache) {
        return;
    }
    const cache = new Image();
    const promise = new Promise(
        (resolve) =>
            (cache.onload = () => {
                imageCache.set(src, true);
                resolve(true);
            })
    );
    cache.src = src;
    await promise;
}

export function getImageUri(id: ImageID) {
    return `/api/images/${id}`;
}

export async function lookupUser(id: UserID): Promise<User | undefined> {
    const res = await fetch(`/api/user/${id}`);
    if (!res.ok) return undefined;
    return await res.json();
}

export async function fetchApi(url: string, body: any): Promise<Response> {
    return fetch(url, {method: 'POST', headers: {'content-type': 'application/json'}, body: JSON.stringify(body)});
}

export async function remark(type: Remarkable, id: any, mode: RemarkMode): Promise<Response> {
    return fetch(`/api/remark/${type}/${mode}/${id}`)
}

export async function postMessage(type: MessageType, body: string, token: string): Promise<Response> {
    body = body.trim();
    return fetchApi(
        `/api/message/${type}`,
        {body, token}
    )
}

export async function verifyReCaptcha(token: string): Promise<boolean> {
    const secret = process.env.RECAPTCHA_KEY_BACKEND;
    const res = await fetch(
        `https://www.google.com/recaptcha/api/siteverify?secret=${secret}&response=${token}`,
        {method: 'POST'}
    );
    const json = await res.json();
    return json.success;
}