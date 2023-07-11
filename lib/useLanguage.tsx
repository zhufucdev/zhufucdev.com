import React, {Dispatch, useContext, useEffect, useState} from "react";

const LanguageInstance =
    React.createContext<LanguageContext>([undefined, () => {
    }]);

export interface LanguageOptions {
    current?: string;
    available: string[]
}

type LanguageContext = [LanguageOptions | undefined, (option?: LanguageOptions) => void];

export function LanguageProvider(props: { children: React.ReactNode }) {
    const options = useState<LanguageOptions>();
    return <LanguageInstance.Provider {...props} value={options}/>
}

export function useLanguage(options?: LanguageOptions): [LanguageOptions | undefined, Dispatch<LanguageOptions>, Dispatch<string>] {
    const [option, setOption] = useContext(LanguageInstance);

    function setCurrent(target: string) {
        if (!option) return;
        setOption({available: option.available, current: target});
    }

    useEffect(() => {
        setOption(options);
        return () => {
            setOption(undefined);
        }
    }, []);
    return [option, setOption, setCurrent];
}
