import * as React from "react";
import {ReactNode, useContext, useEffect, useState} from "react";

const Title = React.createContext<TitleContext>(['', () => {}]);
type TitleContext = [string, (title: string) => void]

export function useTitle(title?: string): TitleContext {
    const [_title, setTitle] = useContext(Title)
    useEffect(() => {
        if (title) {
            setTitle(title)
        }
    }, [title])

    return [_title, setTitle];
}

export function TitleProvider(props: {children: ReactNode, title?: string | undefined}) {
    const value = useState(props.title ?? '');
    return <Title.Provider {...props} value={value} />
}