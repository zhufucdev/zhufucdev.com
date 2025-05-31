import '../styles/globals.sass'
import { AppProps } from 'next/app'
import { EmotionCache } from '@emotion/cache'
import React from 'react'
import AppFrame from '../components/AppFrame'
import Box from '@mui/material/Box'
import routes from '../lib/routes'
import Link from 'next/link'

export interface MyAppProps extends AppProps {
    emotionCache?: EmotionCache
    pageProps: { recaptchaKey: string }
}

function MyApp(props: MyAppProps) {
    return (
        <>
            <AppFrame {...props} />
            <Box hidden>
                {routes
                    .filter((e) => !e.hidden)
                    .map((e) => (
                        <Link key={e.name} href={e.route} legacyBehavior>
                            {e.title}
                        </Link>
                    ))}
            </Box>
        </>
    );
}

export async function getServerSideProps() {
    return {
        props: {
            recaptchaKey: process.env.RECAPTCHA_KEY_FRONTEND as string,
        },
    }
}

export default MyApp
