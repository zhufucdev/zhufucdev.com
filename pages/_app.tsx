import '../styles/globals.sass'
import { AppProps } from 'next/app'
import { EmotionCache } from '@emotion/cache'
import React from 'react'
import AppFrame from "../components/AppFrame";

export interface MyAppProps extends AppProps {
    emotionCache?: EmotionCache
    pageProps: { recaptchaKey: string }
}

function MyApp(props: MyAppProps) {
    return <AppFrame {...props} />
}

export async function getServerSideProps() {
    return {
        props: {
            recaptchaKey: process.env.RECAPTCHA_KEY_FRONTEND as string,
        },
    }
}

export default MyApp
