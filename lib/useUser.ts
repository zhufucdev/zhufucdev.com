import useSWR from "swr";
import {useEffect} from "react";
import {useRouter} from "next/router";

async function fetcher(): Promise<string | undefined> {
    const id = await (await fetch("/api/user")).text();
    return !id || id === 'undefined' ? undefined : id;
}

export function useUser(redirect: boolean = false) {
    const {data: user, mutate: mutateUser, isLoading} = useSWR<string | undefined>('/api/user', fetcher);
    const router = useRouter();
    useEffect(() => {
        if (!user && redirect)
            router.push('/');
    }, [redirect, router, user]);
    return {user, mutateUser, isLoading};
}
