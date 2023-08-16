import InventoryIcon from '@mui/icons-material/Inventory'
import LocalDiningIcon from '@mui/icons-material/LocalDining'
import StarIcon from '@mui/icons-material/Star'
import OpenInNewIcon from '@mui/icons-material/OpenInNew'
import {
    Fade,
    IconButton,
    Paper,
    Skeleton,
    Tooltip,
    Typography,
} from '@mui/material'
import Box from '@mui/material/Box'
import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'

type RepoProvider = 'github'

interface Props {
    provider?: RepoProvider
    id: string
}

export default function Repository({ provider = 'github', id }: Props) {
    const [loading, setLoading] = useState(false)
    const [stats, setStats] = useState<RepoStats>()
    const siteName = useMemo(() => providerName(provider), [provider])

    useEffect(() => {
        setLoading(true)
        repoStats(provider, id).then((r) => {
            setLoading(false)
            setStats(r)
        })
    }, [provider, id])

    return (
        <Box display="flex" justifyContent="center">
            <Paper sx={{ p: 2 }} variant="outlined">
                <Box display="flex" alignItems="center" mb={1}>
                    <InventoryIcon />
                    <Typography variant="subtitle1" ml={1}>
                        {id}
                    </Typography>
                    <span style={{ flexGrow: 1 }} />
                    <Fade in={Boolean(stats)}>
                        <Tooltip title={`在${siteName}中打开`}>
                            <IconButton
                                component={Link}
                                href={stats?.projectUrl ?? '#'}
                                target="_blank"
                            >
                                <OpenInNewIcon />
                            </IconButton>
                        </Tooltip>
                    </Fade>
                </Box>
                {stats ? (
                    <Typography variant="subtitle2">
                        {stats.description}
                    </Typography>
                ) : (
                    loading && (
                        <Skeleton
                            variant="text"
                            sx={{ fontSize: '0.875rem' }}
                        />
                    )
                )}
                <Box
                    display="flex"
                    justifyContent="right"
                    alignItems="center"
                    mt={1}
                >
                    {stats ? (
                        <>
                            <StarIcon />
                            <Typography variant="body2" ml={0.5} mr={2}>
                                {stats.stars}
                            </Typography>
                            <LocalDiningIcon />
                            <Typography variant="body2" ml={0.5}>
                                {stats.forks}
                            </Typography>
                        </>
                    ) : (
                        loading && <Skeleton variant="text" width={20} />
                    )}
                </Box>
            </Paper>
        </Box>
    )
}

interface RepoStats {
    stars: number
    forks: number
    description: string
    projectUrl: string
}

async function repoStats(
    provider: RepoProvider,
    id: string
): Promise<RepoStats | undefined> {
    switch (provider) {
        case 'github':
            const res = await fetch(`https://api.github.com/repos/${id}`, {
                headers: { accept: 'application/json' },
            })
            if (!res.ok) {
                return
            }
            const apiResult = await res.json()
            return {
                stars: apiResult.stargazers_count,
                forks: apiResult.forks_count,
                description: apiResult.description,
                projectUrl: apiResult.html_url,
            }
    }
}

function providerName(provider: RepoProvider): string {
    switch (provider) {
        case 'github':
            return 'GitHub'
    }
}
