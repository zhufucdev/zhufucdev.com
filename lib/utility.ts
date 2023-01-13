import stream from "stream";
import {Remarkable, RemarkMode} from "./db/remark";

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
                    return `${pre}天${clock}`
                } else {
                    return `${dateElasped}天前 ${clock}`
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

export async function fetchApi(url: string, body: any): Promise<Response> {
    return fetch(url, {method: 'POST', headers: {'content-type': 'application/json'}, body: JSON.stringify(body)});
}

export async function remark(type: Remarkable, id: any, mode: RemarkMode): Promise<Response> {
    return fetch(`/api/remark/${type}/${mode}/${id}`)
}


export async function postMessage(type: MessageType, message: MessageContent, token: string): Promise<Response> {
    const body = message.body.trim();
    return fetchApi(
        `/api/message/${type}`,
        type === 'recent' ? {...message, body, token} : {body, token}
    )
}

export async function verifyReCaptcha(token: string): Promise<boolean> {
    const secret = process.env.RECAPTCHA_KEY_BACKEND;
    try {
        const res = await fetch(
            `https://www.google.com/recaptcha/api/siteverify?secret=${secret}&response=${token}`,
            {method: 'POST'}
        );
    const json = await res.json();
        return json.success;
    } catch (e) {
        return false;
    }
}

export async function uploadImage(file: File): Promise<Response> {
    const form = new FormData();
    form.set("file", file);

    return await fetch(
        '/api/images',
        {
            method: 'POST',
            body: form
        }
    );
}

export async function readAll(stream: stream.Readable): Promise<Buffer> {
    return new Promise<Buffer>((resolve, reject) => {
        const chunks = new Array<Uint8Array>();
        stream.on('data', chunk => {
            chunks.push(chunk);
        })
        stream.on('error', reject);
        stream.on('close', () => resolve(Buffer.concat(chunks)));
    });
}