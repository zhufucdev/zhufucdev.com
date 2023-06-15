import * as React from "react";
import {ConsumerProps, ReactNode, useContext, useEffect, useState} from "react";

const Title = React.createContext<TitleContext>(['', () => {}]);
type TitleLike = string | {appbar: string, head: string}
type TitleContext = [TitleLike, (title: TitleLike) => void]

export function useTitle(title?: TitleLike): TitleContext {
    const [_title, setTitle] = useContext(Title)
    useEffect(() => {
        if (title) {
            setTitle(title)
        }
    }, []);

    return [_title, setTitle];
}

export function TitleProvider(props: {children: ReactNode, title?: TitleLike | undefined}) {
    const value = useState(props.title ?? '');
    return <Title.Provider {...props} value={value} />
}

export function TitleConsumer(props: ConsumerProps<TitleContext>) {
    return <Title.Consumer {...props}/>
}

export function getTitle(title: TitleLike | undefined, isHead: boolean): string {
    if (!title) {
        return 'zhufucdev';
    }
    if (typeof title == "string") {
        return title;
    }

    return isHead ? title.head : title.appbar;
}