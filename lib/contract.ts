/**
 * Something both frontend and backend agrees to
 */

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
