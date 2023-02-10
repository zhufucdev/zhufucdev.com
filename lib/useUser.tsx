import useSWR from "swr";
import React, {useContext, useEffect, useState} from "react";
import {useRouter} from "next/router";
import {User} from "./db/user";

async function fetcher(): Promise<UserID | undefined> {
    const id = await (await fetch("/api/user")).text();
    return !id || id === 'undefined' ? undefined : id;
}

/**
 * Hook to user id of yourself
 * @param redirect to redirect to home page if not logged in or not
 */
export function useUser(redirect: boolean = false) {
    const {data: user, mutate: mutateUser, isLoading} = useSWR<UserID | undefined>('/api/user', fetcher);
    const router = useRouter();
    useEffect(() => {
        if (!user && redirect)
            router.push('/');
    }, [redirect, router, user]);
    return {user, mutateUser, isLoading};
}

export async function lookupUser(id: UserID): Promise<User | undefined> {
    const res = await fetch(`/api/user/${id}`);
    if (!res.ok) return undefined;
    return await res.json();
}

type ProfileCallback = {
    user: User | undefined,
    isLoading: boolean,
}

type SelfProfileCallback = ProfileCallback & {
    mutateUser: (id?: string) => void
}

/**
 * Hook to a specific user profile
 * @param id the target user
 * @returns ProfileCallback
 */
export function useProfileOf(id?: UserID): ProfileCallback {
    const [isLoading, setLoading] = useState(true);
    const [user, setUser] = useState<User>();
    useEffect(() => {
        if (!id) {
            setLoading(false);
            setUser(undefined);
        } else {
            lookupUser(id).then(v => {
                setUser(v);
                setLoading(false);
            })
        }
    }, [id]);
    return {user, isLoading};
}

/**
 * Hook to user profile of yourself
 * @returns undefined if the api is not ready,
 * null if the user doesn't exist, or what you want
 */
export function useProfile(): SelfProfileCallback {
    const {user: id, isLoading, mutateUser} = useUser();
    const profile = useProfileOf(id);

    return {user: profile.user, mutateUser, isLoading: isLoading || profile.isLoading};
}

/**
 * Same as {@link useProfile}, but from context provider
 */
export function useProfileContext(): SelfProfileCallback {
    return useContext(SelfContext);
}

export const myId = 'zhufucdev';

export function isMe(user: User | UserID): boolean {
    if (typeof user === 'string') return user === myId;
    return user._id === myId
}

const SelfContext = React.createContext<SelfProfileCallback>({user: undefined, mutateUser: () => {}, isLoading: false});

export function SelfProfileProvider(props: SelfProfileCallback & {children: React.ReactNode}) {
    return <SelfContext.Provider value={props}>
        {props.children}
    </SelfContext.Provider>
}