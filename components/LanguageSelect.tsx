import {FormControl, InputLabel, MenuItem, Select, SxProps} from "@mui/material";
import * as React from "react";
import {defaultLang, getLanguageName} from "../lib/translation";
import {LanguageOption} from "../lib/useLanguage";
import Link from "next/link";

interface Props {
    current: string
    available: LanguageOption[]
    onLanguageSwitched: (target: string) => void
    sx?: SxProps
}

export default function LanguageSelect({current, available, sx, onLanguageSwitched}: Props) {
    return <FormControl variant="outlined" size="small" sx={sx}>
        <InputLabel>语言</InputLabel>
        <Select label="语言"
                onChange={ev => onLanguageSwitched(ev.target.value)}
                value={current ?? defaultLang}>
            {available.map(({name, href}) => (
                // @ts-ignore
                <MenuItem
                    value={name}
                    key={name}
                    component={Link}
                    href={href}>
                    {getLanguageName(name)}
                </MenuItem>
            ))}
        </Select>
    </FormControl>
}
