import React, {Dispatch, useContext, useEffect, useState} from "react";

const LanguageInstance =
    React.createContext<LanguageContext>([undefined, () => {
    }]);

export interface LanguageSettings {
    current?: string;
    available: LanguageOption[]
}

export interface LanguageOption {
    name: string;
    href: string;
}

type LanguageContext = [LanguageSettings | undefined, (option?: LanguageSettings) => void];

export function LanguageProvider(props: { children: React.ReactNode }) {
    const options = useState<LanguageSettings>();
    return <LanguageInstance.Provider {...props} value={options}/>
}

export function useLanguage(options?: LanguageSettings): [LanguageSettings | undefined, Dispatch<LanguageSettings>, Dispatch<string>] {
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
    }, [options]);
    return [option, setOption, setCurrent];
}
