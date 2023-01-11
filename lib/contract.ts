/* !********************************************
 * Something both frontend and backend agrees to
 **********************************************/

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
    }
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
