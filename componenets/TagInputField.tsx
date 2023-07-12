import FilledInput from "@mui/material/FilledInput";
import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import InputBase from "@mui/material/InputBase";
import Popover from "@mui/material/Popover";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import {useEffect, useMemo, useRef, useState} from "react";
import List from "@mui/material/List";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemText from "@mui/material/ListItemText";
import {Tag, TagKey, TagKeyUtil} from "../lib/tagging";
import {ArticleMeta} from "../lib/db/article";

interface Props {
    tags: Tag[];
    hardcoded: Tag[];
    context?: Partial<ArticleMeta>;
    onChanged: (newValue: Tag[]) => void;
}

interface InputProps extends Props {
    setFocused: (v: boolean) => void;
    inputBuffer: string;
    setInputBuffer: (v: string) => void;
    invalidTags: Tag[];
}

interface ChipProps {
    tag: Tag,
    hardcoded?: boolean,
    onValueChanged?: (newValue: string) => void;
    onDelete?: () => void,
    error?: boolean
}

function ChipInput({tag, hardcoded, onValueChanged, onDelete, error}: ChipProps) {
    let label: JSX.Element;

    if (!hardcoded) {
        label = <Box alignItems="center" display="flex">
            {TagKeyUtil.getDisplayName(tag.key)}
            {typeof tag.value === 'string'
                && <Box alignItems="center" display="flex" position="relative" ml={0.5} minWidth='1.6rem'>
                    <span style={{visibility: 'hidden'}}>{tag.value}</span>
                    <InputBase
                        sx={{
                            fontSize: '0.8rem',
                            position: 'absolute',
                            left: 0,
                            transform: 'translateY(1px)',
                            width: '100%'
                        }}
                        value={tag.value}
                        onChange={onValueChanged ? ev => onValueChanged(ev.currentTarget.value) : undefined}/>
                </Box>
            }
        </Box>
    } else {
        label = <Box alignItems="center" display="flex">
            {TagKeyUtil.getDisplayName(tag.key)}
            {typeof tag.value === 'string' && <span style={{marginLeft: 6}}>{tag.value}</span>}
        </Box>
    }

    return <Chip label={label} onDelete={onDelete} color={error ? "error" : undefined}/>
}

function InputImpl(props: InputProps): JSX.Element {
    return <Stack direction="row" p={1} ml={0.8} spacing={1} overflow="auto" width="100%">
        {props.hardcoded.map(t => <ChipInput key={t.key} tag={t} hardcoded/>)}
        {props.tags.map(
            (e, i) =>
                <ChipInput key={e.key}
                           tag={e}
                           error={props.invalidTags.includes(e)}
                           onValueChanged={(newValue) => {
                               e.value = newValue
                               props.onChanged(
                                   props.tags.slice(0, i)
                                       .concat(e, props.tags.slice(i + 1))
                               )
                           }}
                           onDelete={() => props.onChanged(props.tags.slice(0, i).concat(props.tags.slice(i + 1)))}/>
        )}
        <InputBase value={props.inputBuffer}
                   onChange={ev => props.setInputBuffer(ev.currentTarget.value)}
                   onFocus={() => props.setFocused(true)}
                   onBlur={() => props.setFocused(false)}
                   fullWidth
        />
    </Stack>
}

export default function TagInputField(props: Props) {
    const wrapperRef = useRef<HTMLElement>(null);
    const [inputBuffer, setInputBuffer] = useState('');
    const [isFocused, setFocused] = useState(false);
    const invalid = useMemo(() => props.tags.filter(tag => !tag.valid()), [props.tags]);

    useEffect(() => {
        if (!wrapperRef.current) {
            return
        }
        if (isFocused) {
            wrapperRef.current.classList.add('Mui-focused');
        } else {
            wrapperRef.current.classList.remove('Mui-focused');
        }
    }, [isFocused]);

    const options = useMemo(() => {
        const r: { key: TagKey, name: string }[] = [];
        for (const key in TagKey) {
            r.push({key: TagKeyUtil.getByName(key), name: TagKeyUtil.getDisplayName(TagKeyUtil.getByName(key))})
        }
        return r;
    }, []);

    const optionsFiltered =
        options.filter(v =>
            !props.tags.concat(props.hardcoded).find(e => e.key === v.key)
            && (v.name.includes(inputBuffer) || v.key.includes(inputBuffer)))

    return <Box>
        <FilledInput components={{Input: InputImpl}}
                     inputProps={{...props, setFocused, inputBuffer, setInputBuffer, invalidTags: invalid}}
                     ref={wrapperRef}
                     error={invalid.length > 0}
                     fullWidth/>
        <Typography hidden={invalid.length <= 0} color="error" variant="caption">无效标签</Typography>
        <Popover open={isFocused && optionsFiltered.length > 0}
                 disableRestoreFocus disableAutoFocus anchorEl={wrapperRef.current}
                 anchorOrigin={{
                     vertical: 'bottom',
                     horizontal: 'left'
                 }}>
            <List>
                {optionsFiltered.map(
                    v => (
                        <ListItemButton key={String(v.key)}
                                        onClick={() => {
                                            setInputBuffer('');
                                            props.onChanged(props.tags.concat(
                                                onTagAppend(v.key, props.context)));
                                        }}>
                            <ListItemText>{v.name}</ListItemText>
                            <Typography variant="caption" ml={1}>{v.key}</Typography>
                        </ListItemButton>
                    )
                )}
            </List>
        </Popover>
    </Box>
}

function onTagAppend(key: TagKey, context?: Partial<ArticleMeta>): Tag {
    if (!context) return new Tag(key);

    switch (key) {
        case TagKey.TranslatedFrom:
            return new Tag(TagKey.TranslatedFrom, context._id ?? '');
        default:
            return new Tag(key);
    }
}