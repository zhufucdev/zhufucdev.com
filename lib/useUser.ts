import useSWR from "swr";
import {useEffect, useState} from "react";
import {useRouter} from "next/router";
import {lookupUser} from "./utility";

async function fetcher(): Promise<string | undefined> {
    const id = await (await fetch("/api/user")).text();
    return !id || id === 'undefined' ? undefined : id;
}

/**
 * Hook to user profile of yourself
 * @param redirect to redirect to home page if not logged in or not
 */
export function useUser(redirect: boolean = false) {
    const {data: user, mutate: mutateUser, isLoading} = useSWR<string | undefined>('/api/user', fetcher);
    const router = useRouter();
    useEffect(() => {
        if (!user && redirect)
            router.push('/');
    }, [redirect, router, user]);
    return {user, mutateUser, isLoading};
}

/**
 * Hook to a specific user profile
 * @param id the target user
 * @returns undefined if the api is not ready,
 * null if the user doesn't exist, or what you want
 */
export function useProfile(id: UserID): User | undefined | null {
    const [user, setUser] = useState<User | null>();
    useEffect(() => {
        lookupUser(id)
            .then(v => setUser(v))
    }, [id]);
    return user;
}