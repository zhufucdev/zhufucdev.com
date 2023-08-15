import { useEffect, useRef, useState } from 'react'
import { nanoid } from 'nanoid'
import {
    LocalCache,
    LocalImage,
    MarkdownScope,
    MarkdownScopeProps,
} from './MarkdownScope'
import MDEditor, { ICommand } from '@uiw/react-md-editor'
import * as commands from '@uiw/react-md-editor/lib/commands'

import UploadIcon from '@mui/icons-material/UploadOutlined'
import { MDXRemoteSerializeResult } from 'next-mdx-remote'
import { Card, Collapse, Typography } from '@mui/material'
import { fetchApi } from '../lib/utility'
import { useGoogleReCaptcha } from 'react-google-recaptcha-v3'
import { useSnackbar } from 'notistack'
import HelperCard from './HelperCard'

type EditorProps = {
    value: string | undefined
    preload: LocalImage
    onChange: (value: string) => void
    onUploadImage: (key: string, image: File) => void
}

export default function MdxEditor({
    value,
    preload,
    onChange,
    onUploadImage,
}: EditorProps): JSX.Element {
    const [imageCache, setImageCache] = useState<LocalCache>({})
    const uploadRef = useRef<HTMLInputElement>(null)

    const uploadImage: ICommand = {
        name: 'upload image',
        keyCommand: 'upload',
        buttonProps: { 'aria-label': '上传图片' },
        icon: <UploadIcon sx={{ fontSize: 16 }} />,
        execute: (state, api) => {
            if (!uploadRef.current) return

            uploadRef.current.click()
            const changeListener = () => {
                const file = uploadRef.current!.files?.item(0)
                if (!file) return
                const id = nanoid()
                onUploadImage(id, file)

                if (state.selectedText) {
                    api.replaceSelection(id)
                } else {
                    api.replaceSelection(
                        `![image-${
                            Object.getOwnPropertyNames(preload).length
                        }](${id})`
                    )
                }
            }
            uploadRef.current.addEventListener('change', changeListener, {
                once: true,
            })
            uploadRef.current.addEventListener('cancel', (ev) => {
                ev.currentTarget!.removeEventListener('change', changeListener)
            })
        },
    }

    function handleNewCache(key: string, cache: string) {
        const nextCache = imageCache
        nextCache[key] = cache
        setImageCache(nextCache)
    }

    return (
        <>
            <MDEditor
                value={value}
                onChange={(v) => onChange(v ?? '')}
                components={{
                    preview: () => (
                        <Preview
                            preload={preload}
                            imageCache={imageCache}
                            newCache={handleNewCache}
                        >
                            {value || ''}
                        </Preview>
                    ),
                }}
                commands={commands.getCommands()}
                extraCommands={[
                    uploadImage,
                    commands.divider,
                    ...commands.getExtraCommands(),
                ]}
            />
            <input hidden type="file" accept="image/*" ref={uploadRef} />
        </>
    )
}

type PreviewProps = Omit<MarkdownScopeProps, 'children'> & { children: string }

function Preview({ children, ...props }: PreviewProps) {
    const [rendered, setRendered] = useState<MDXRemoteSerializeResult>()
    const [error, setError] = useState<string>()
    const { executeRecaptcha } = useGoogleReCaptcha()
    const { enqueueSnackbar } = useSnackbar()
    const content = useRef(children)
    useEffect(() => {
        content.current = children
        const captured = content.current
        setTimeout(() => {
            if (captured === content.current) {
                if (executeRecaptcha) {
                    executeRecaptcha().then((token) =>
                        render(children, token).then((rendered) => {
                            if (typeof rendered !== 'string') {
                                setRendered(rendered)
                                setError(undefined)
                            } else {
                                setError(rendered)
                            }
                        })
                    )
                } else {
                    enqueueSnackbar('bug：reCaptcha未就绪', {
                        variant: 'error',
                    })
                }
            }
        }, 1500)
    }, [children])
    return (
        <>
            {error && (
                <HelperCard
                    variant="error"
                    title="服务器未能完成渲染"
                    content={error}
                    sx={{ position: 'absolute', width: '70%', left: '14%' }}
                />
            )}
            {rendered && <MarkdownScope {...props}>{rendered}</MarkdownScope>}
        </>
    )
}

async function render(
    content: string,
    token: string
): Promise<MDXRemoteSerializeResult | string> {
    const res = await fetchApi('/api/article/render', { content, token })
    if (!res.ok) {
        return await res.text()
    }
    return res.json()
}
