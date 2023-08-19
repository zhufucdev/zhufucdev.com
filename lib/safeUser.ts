import {User} from "./db/user";

/**
 * User info that is safe to pass through
 * server side props
 */
export type SafeUser = Omit<User, "registerTime"> & {
    registerTime: string
};

export function getSafeUser(user: User): SafeUser {
    return {
        ...user,
        registerTime: user.registerTime.toISOString()
    }
}

export function fromSafeUser(su: SafeUser): User {
    return {
        ...su,
        registerTime: new Date(su.registerTime)
    }
}
