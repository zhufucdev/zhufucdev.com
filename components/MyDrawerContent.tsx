import { useRouter } from 'next/router'
import { useContents } from '../lib/useContents'
import Toolbar from '@mui/material/Toolbar'
import Divider from '@mui/material/Divider'
import List from '@mui/material/List'
import Box from '@mui/material/Box'
import ListItem from '@mui/material/ListItem'
import ListItemButton from '@mui/material/ListItemButton'
import Link from 'next/link'
import ListItemIcon from '@mui/material/ListItemIcon'
import ListItemText from '@mui/material/ListItemText'
import { ContentsNodeComponent } from './ContentsNodeComponent'
import * as React from 'react'
import routes from "../lib/routes";

export default function MyDrawerContent(props: { onItemClicked: () => void }) {
    const router = useRouter()
    const [root] = useContents()

    return (
        <>
            <Toolbar />
            <Divider />
            <List
                sx={{
                    '.MuiListItemButton-root': {
                        borderTopRightRadius: 20,
                        borderBottomRightRadius: 20,
                    },
                }}
            >
                {routes
                    .filter((e) => !e.hidden)
                    .map((entry) => (
                        <Box key={entry.name}>
                            <ListItem disablePadding>
                                <ListItemButton
                                    onClick={props.onItemClicked}
                                    component={Link}
                                    href={entry.route!}
                                    selected={entry.route === router.pathname}
                                >
                                    <ListItemIcon>{entry.icon}</ListItemIcon>
                                    <ListItemText primary={entry.title} />
                                </ListItemButton>
                            </ListItem>
                            {entry.name === root?.target && (
                                <Box
                                    sx={{
                                        display: { sm: 'block', md: 'none' },
                                    }}
                                >
                                    <ContentsNodeComponent
                                        node={root}
                                        onClick={props.onItemClicked}
                                    />
                                </Box>
                            )}
                        </Box>
                    ))}
            </List>
        </>
    )
}