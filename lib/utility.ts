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
            return `${(time.getMonth() + 1).toLocaleString("zh-CN")}月${time.getDate().toLocaleString("zh-CN")}日
            ${clock}`;
        }
    } else {
        const yearElasped = now.getFullYear() - time.getFullYear();
        return `${prefix(yearElasped) || time.getFullYear()}年${
            time.getMonth() + 1
        }月${time.getDate()}日 ${clock}`;
    }
}

export async function cacheImage(src: string) {
    const cache = new Image();
    const promise = new Promise(
        (resolve) =>
            (cache.onload = () => {
                resolve(true);
            })
    );
    cache.src = src;
    await promise;
}

export function getImageUri(id: ImageID) {
    return `/api/images/${id}`;
}

export async function lookupImage(id: ImageID): Promise<ImageMetaClient | undefined> {
    const res = await fetch(`/api/images/${id}/meta`);
    if (!res.ok) return undefined;
    return res.json();
}

export async function fetchApi(url: string, body: any): Promise<Response> {
    return fetch(url, {method: 'POST', headers: {'content-type': 'application/json'}, body: JSON.stringify(body)});
}

export async function remark(type: Remarkable, id: any, mode: RemarkMode): Promise<Response> {
    return fetch(`/api/remark/${type}/${mode}/${id}`)
}

export async function postMessage(type: MessageType, ref: string, message: MessageContent, token: string): Promise<Response> {
    const body = message.body.trim();
    return fetchApi(
        `/api/message/${type}`,
        type === 'recent' ? {...message, body, token, ref} : {body, token, ref}
    )
}

/**
 * To post something, first apply for it.
 * Access this api to get a token for next steps,
 * which with the post being uploaded can be referred to.
 * In another word, the token is its id, if the post is completed.
 *
 * Usually, the token is called 'ref'
 * @param type
 */
export async function beginPost(type: Postable): Promise<string> {
    return fetch(`/api/begin/${type}`).then(res => res.text());
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

/**
 * Client operation. Upload an image to database
 * @param file the image
 * @param token from reCAPTCHA
 * @param useAs what the image is used for
 * @param target present only if {@link useAs} is set to 'cover' or 'post'.
 * If so, the image will be automatically deleted if the cover is changed or
 * the post is deleted. Moreover, if using as 'avatar', image shall be deleted
 * if the same user changes the avatar.
 */
export async function uploadImage(file: Blob, token: string, useAs: ImageUse = 'save', target: string[] = []): Promise<Response> {
    const form = new FormData();
    form.set("file", file);
    form.set("token", token);
    form.set("use", useAs);
    if (useAs === 'cover' || useAs === 'post') {
        form.set("target", JSON.stringify(target));
    }

    return await fetch(
        '/api/images',
        {
            method: 'POST',
            body: form
        }
    );
}

/**
 * Buffer a stream. Wonder why ECMScript isn't shipped with this
 * @param stream the stream
 */
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