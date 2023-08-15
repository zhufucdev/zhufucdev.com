import '../styles/globals.sass'
import LoadingScreen from '../components/LoadingScreen'
import { AppProps } from 'next/app'
import { EmotionCache } from '@emotion/cache'
import React from 'react'
import dynamic from 'next/dynamic'

export interface MyAppProps extends AppProps {
    emotionCache?: EmotionCache
    pageProps: { recaptchaKey: string }
}

const AppFrame = dynamic(() => import('../components/AppFrame'), {
    loading: () => <LoadingScreen />,
})

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
