'use client';

import * as React from 'react';
import { CacheProvider, EmotionCache } from '@emotion/react';
import { ThemeProvider, createTheme, ThemeOptions, useMediaQuery } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { Analytics } from '@vercel/analytics/react';
import { SnackbarProvider } from 'notistack'; // Ensure this is the correct import

import createEmotionCache from '../lib/emotionCache';
import { SelfProfileProvider, useProfile } // Assuming useProfile is for initial data, might need adjustment
from '../lib/useUser';
import { TitleProvider } from '../lib/useTitle';
import { ContentsProvider } from '../lib/useContents';
import { LanguageProvider } from '../lib/useLanguage';

// Client-side cache, shared for the whole session of the user in the browser.
const clientEmotionCache = createEmotionCache();

function getDesignTokens(dark: boolean): ThemeOptions {
    return dark
        ? {
              palette: {
                  mode: 'dark',
                  primary: {
                      main: '#EF6C00',
                  },
                  secondary: {
                      main: '#00BCD4',
                  },
              },
          }
        : {
              palette: {
                  mode: 'light',
                  primary: {
                      main: '#E65100',
                  },
                  secondary: {
                      main: '#00ACC1',
                  },
              },
          };
}

export default function ThemeProviders({
    children,
    pageProps, // Pass pageProps if they contain necessary initial context values
}: {
    children: React.ReactNode;
    pageProps: any; // Adjust type as necessary, e.g., { initialSelfProfile?: any, recaptchaKey?: string }
}) {
    const emotionCache = clientEmotionCache; // Use the clientEmotionCache for all providers
    const prefersDark = useMediaQuery('(prefers-color-scheme: dark)');
    const theme = React.useMemo(
        () => createTheme(getDesignTokens(prefersDark)),
        [prefersDark]
    );

    // For SelfProfileProvider, initial state might come from pageProps or be fetched.
    // This is a simplified example; actual initial profile might need to be handled differently
    // if `useProfile()` in AppFrame was fetching or using initial props.
    // For now, assuming pageProps might contain initialSelfProfile if needed by SelfProfileProvider.
    // Or, SelfProfileProvider might fetch its own data.
    const initialSelfProfile = pageProps?.initialSelfProfile || { user: null, loading: true, error: null };


    return (
        <CacheProvider value={emotionCache}>
            <ThemeProvider theme={theme}>
                <TitleProvider> {/* Initial title might be set differently in App Router */}
                    <ContentsProvider>
                        <SnackbarProvider>
                            <SelfProfileProvider {...initialSelfProfile}>
                                <LanguageProvider>
                                    <CssBaseline />
                                    {children}
                                    <Analytics />
                                </LanguageProvider>
                            </SelfProfileProvider>
                        </SnackbarProvider>
                    </ContentsProvider>
                </TitleProvider>
            </ThemeProvider>
        </CacheProvider>
    );
}
