import {FormControl, InputLabel, MenuItem, Select, SxProps, Typography} from "@mui/material";
import * as React from "react";
import {defaultLang, getLanguageName} from "../lib/translation";
import CheckIcon from "@mui/icons-material/Check";

interface Props {
    current: string
    available: string[]
    onLanguageSwitched: (target: string) => void
    sx?: SxProps
}

export default function LanguageSelect({current, available, sx, onLanguageSwitched}: Props) {
    return <FormControl variant="outlined" size="small" sx={sx}>
        <InputLabel>语言</InputLabel>
        <Select label="语言"
                onChange={ev => onLanguageSwitched(ev.target.value)}
                value={current ?? defaultLang}>
            {available.map(code =>
                <MenuItem key={code} value={code}>
                    {getLanguageName(code)}
                </MenuItem>
            )}
        </Select>
    </FormControl>
}