/* !********************************************
 * Something both frontend and backend agrees to
 **********************************************/

import {User} from "./db/user";

export const maxUserMessageLength = 500;

export const userContract = {
    testID: (id: string) => {
        if (id === 'undefined') return false
        const idScheme = /^[a-zA-Z0-9_-]{3,15}$/;
        return idScheme.test(id);
    },
    testPwd: (pwd: string) => {
        const pwdScheme = /([a-zA-Z]+)|([0-9]+)/g;
        const matches = pwd.matchAll(pwdScheme);
        let count = 0;
        while (!matches.next().done) {
            count++;
        }
        return count >= 2;
    },
    testNick: (nick: string) => {
        const illegal = /[*·$()（）「」【】/|\\@《》<>]/;
        return !illegal.test(nick);
    },
    maxBioLen: 50
}

export async function getResponseRemark(res: Response): Promise<RequestResult> {
    if (res.ok) {
        return {success: true};
    } else {
        switch (res.status) {
            case 400:
                return {
                    success: false,
                    respond: await res.text(),
                    msg: "bug"
                }
            case 401:
                return {
                    success: false,
                    respond: await res.text(),
                    msg: "一个bug导致了你未登录"
                }
            case 403:
                return {
                    success: false,
                    respond: await res.text(),
                    msg: "没有权限"
                }
            case 500:
                return {
                    success: false,
                    respond: await res.text(),
                    msg: "一个bug导致数据库未响应"
                }
            default:
                return {
                    success: false,
                    respond: await res.text(),
                    msg: "咋回事？"
                }
        }
    }
}

export const reCaptchaNotReady = {
    msg: '咋回事？',
    respond: 'reCAPTCHA服务未就绪',
    success: false
}

export function hasPermission(user: User, permit: PermissionID): boolean {
    if (user.permissions.includes("default")) {
        const defaultPermissions: PermissionID[] = [
            "raise_issue",
            "raise_inspiration",
            "pr_article",
            "send_pm",
            "comment",
            "remark",
            "edit_own_post",
            "change_nick",
            "change_avatar",
            "change_biography"
        ]
        return defaultPermissions.includes(permit);
    } else if (user.permissions.includes("*")) {
        return true;
    } else {
        return user.permissions.includes(permit);
    }
}
