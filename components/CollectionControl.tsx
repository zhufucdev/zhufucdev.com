import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'

import Button from '@mui/material/Button'
import Popover from '@mui/material/Popover'
import { useEffect, useRef, useState } from 'react'

import { SpecificCollection } from '../pages/api/article/collection/[id]'
import PlaylistRemoveIcon from '@mui/icons-material/PlaylistRemove'
import PlaylistAddIcon from '@mui/icons-material/PlaylistAdd'
import Skeleton from '@mui/material/Skeleton'
import List from '@mui/material/List'
import { Checkbox, ListItem, ListItemButton } from '@mui/material'
import { Caption } from './Caption'

interface Props {
    collections?: SpecificCollection
    loading?: boolean
    onItemsChanged: (newValue: SpecificCollection) => void
}

export default function CollectionControl({ collections, loading, onItemsChanged }: Props) {
    const [open, setOpen] = useState(false)
    const anchorEle = useRef<HTMLButtonElement>(null)

    return (
        <>
            <Box display="flex" flexDirection="row" alignItems="center">
                <Typography>属于哪些合集</Typography>
                <span style={{ flexGrow: 1 }} />
                <Button
                    startIcon={<PlaylistAddIcon />}
                    onClick={() => setOpen(true)}
                    ref={anchorEle}
                >
                    管理
                </Button>
            </Box>
            <Popover
                open={open}
                onClose={() => setOpen(false)}
                anchorEl={anchorEle.current}
                transformOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
            >
                {loading ? (
                    <CollectionPlaceholder />
                ) : collections ? (
                    <CollectionList
                        items={collections}
                        onItemsChanged={onItemsChanged}
                    />
                ) : (
                    <CollectionPlaceholder />
                )}
            </Popover>
        </>
    )
}

function CollectionPlaceholder() {
    return (
        <Box p={2}>
            {[0, 1, 2].map((id) => (
                <Skeleton
                    key={`skeleton-${id}`}
                    variant="text"
                    width={200}
                    sx={{ fontSize: '1.675rem' }}
                />
            ))}
        </Box>
    )
}

interface ListProps {
    items: SpecificCollection
    onItemsChanged: (newValue: SpecificCollection) => void
}

function CollectionList({ items, onItemsChanged }: ListProps) {
    function handleCheck(id: ArticleID, checked: boolean) {
        const t = {...items}
        t[id].containing = checked
        onItemsChanged(t)
    }
    if (Object.entries(items).length <= 0) {
        return (
            <Box
                width={300}
                height={200}
                display="flex"
                justifyContent="center"
                alignItems="center"
                flexDirection="column"
            >
                <PlaylistRemoveIcon fontSize="large" />
                <Typography mt={1}>没有合集</Typography>
            </Box>
        )
    }
    return (
        <>
            <Caption ml={2} mt={2} mb={-1}>
                合集
            </Caption>
            <List sx={{minWidth: 200}}>
                {Object.entries(items).map(([key, value]) => (
                    <ListItem
                        secondaryAction={
                            <Checkbox
                                edge="end"
                                checked={value.containing}
                                onChange={(ev) =>
                                    handleCheck(key, ev.target.checked)
                                }
                            />
                        }
                        disablePadding
                    >
                        <ListItemButton
                            key={key}
                            onClick={() => handleCheck(key, !value.containing)}
                        >
                            <Typography>{value.title}</Typography>
                        </ListItemButton>
                    </ListItem>
                ))}
            </List>
        </>
    )
}
