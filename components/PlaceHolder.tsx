import { SxProps } from '@mui/material'
import Grid from '@mui/material/Grid'
import Typography from '@mui/material/Typography'
import React from 'react'

function PlaceHolder(props: {
    icon: React.ComponentType,
    title: string
    sx?: SxProps
}) {
    const { icon, title } = props
    return (
        <Grid
            container
            justifyContent="center"
            alignItems="center"
            sx={props.sx}
        >
            <div
                style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                }}
            >
                {React.createElement(icon, {
                    style: {
                        width: 48,
                        height: 48,
                    },
                    color: 'disabled',
                } as any)}
                <Typography variant="h5" color="text.disabled" mt={2}>
                    {title}
                </Typography>
            </div>
        </Grid>
    )
}

export default PlaceHolder
