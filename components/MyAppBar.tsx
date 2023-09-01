import { useScrollTrigger, useTheme } from '@mui/material'
import { useRouter } from 'next/router'
import { useProfileContext } from '../lib/useUser'
import { useRequestResult } from '../lib/useRequestResult'
import { getTitle, useTitle } from '../lib/useTitle'
import * as React from 'react'
import { useMemo, useRef, useState } from 'react'
import { LanguageSettings, useLanguage } from '../lib/useLanguage'
import { fetchApi } from '../lib/utility'
import { getResponseRemark } from '../lib/contract'
import AppBar from '@mui/material/AppBar'
import Toolbar from '@mui/material/Toolbar'
import IconButton from '@mui/material/IconButton'
import MenuIcon from '@mui/icons-material/Menu'
import Typography from '@mui/material/Typography'
import LanguageSelect from './LanguageSelect'
import { defaultLang, getLanguageName } from '../lib/translation'
import Tooltip from '@mui/material/Tooltip'
import { LazyAvatar } from './LazyAvatar'
import AccountIcon from '@mui/icons-material/AccountCircleOutlined'
import Menu from '@mui/material/Menu'
import MenuList from '@mui/material/MenuList'
import MenuItem from '@mui/material/MenuItem'
import Link from 'next/link'
import ListItemIcon from '@mui/material/ListItemIcon'
import ListItemText from '@mui/material/ListItemText'
import LogoutIcon from '@mui/icons-material/LogoutOutlined'
import LoginIcon from '@mui/icons-material/LoginOutlined'
import { drawerWidth } from './AppFrame'
import LanguageIcon from '@mui/icons-material/LanguageOutlined'
import Popover from '@mui/material/Popover'
import { Caption } from './Caption'
import List from '@mui/material/List'
import ListItemButton from '@mui/material/ListItemButton'
import { IconButtonTypeMap } from '@mui/material/IconButton'

type MyAppBarProps = {
    onToggleDrawer: () => void
}

export default function MyAppBar(props: MyAppBarProps): JSX.Element {
    const theme = useTheme()
    const router = useRouter()

    const { user, mutateUser, isLoading: isUserLoading } = useProfileContext()
    const handleResult = useRequestResult()
    const [_title] = useTitle()
    const title = useMemo(() => getTitle(_title, false), [_title])
    const [userMenuAnchor, setUserMenuAnchor] = React.useState<HTMLElement>()
    const [langOptions, , setTargetLang] = useLanguage()

    const handleLogout = async () => {
        const res = await fetchApi('/api/login', { logout: true })
        const remark = await getResponseRemark(res)
        handleResult(remark)
        await mutateUser(undefined)
        setUserMenuAnchor(undefined)
    }
    const dismissHandler = () => setUserMenuAnchor(undefined)

    const scrolled = useScrollTrigger({
        disableHysteresis: true,
        threshold: 0,
    })
    const useSurfaceColor = theme.palette.mode === 'light' && !scrolled
    const menuItemColor = useSurfaceColor ? 'default' : 'inherit'

    return (
        <AppBar
            position="fixed"
            sx={{
                width: { sm: `calc(100% - ${drawerWidth}px)` },
                ml: `${drawerWidth}px`,
                background: scrolled ? undefined : 'transparent', // for user cover
            }}
            elevation={scrolled ? 4 : 0}
        >
            <Toolbar>
                <IconButton
                    color={menuItemColor}
                    aria-label="open drawer"
                    edge="start"
                    onClick={props.onToggleDrawer}
                    sx={{ mr: 2, display: { sm: 'none' } }}
                >
                    <MenuIcon />
                </IconButton>
                <Typography
                    variant="h6"
                    noWrap
                    color={useSurfaceColor ? 'text.primary' : 'inherit'}
                    component="div"
                    sx={{ flexGrow: 1 }}
                >
                    {title}
                </Typography>
                {langOptions && (
                    <LanguageSelect
                        current={langOptions.current ?? defaultLang}
                        available={langOptions.available}
                        sx={{
                            mr: 2,
                            [theme.breakpoints.down('md')]: { display: 'none' },
                        }}
                        onLanguageSwitched={setTargetLang}
                    />
                )}
                {langOptions && (
                    <LanguageSwitch
                        settings={langOptions}
                        onSwitched={setTargetLang}
                        color={menuItemColor}
                    />
                )}
                <Tooltip
                    title={isUserLoading ? '' : user ? user.nick : '未登录'}
                >
                    <span>
                        <IconButton
                            onClick={(ev) =>
                                setUserMenuAnchor(ev.currentTarget)
                            }
                            disabled={isUserLoading}
                            color={menuItemColor}
                        >
                            {user ? (
                                <LazyAvatar
                                    user={user}
                                    size={32}
                                    loading={isUserLoading}
                                />
                            ) : (
                                <AccountIcon />
                            )}
                        </IconButton>
                    </span>
                </Tooltip>
                <Menu
                    open={Boolean(userMenuAnchor)}
                    anchorEl={userMenuAnchor}
                    onClose={() => setUserMenuAnchor(undefined)}
                    transformOrigin={{
                        vertical: 'top',
                        horizontal: 'right',
                    }}
                    anchorOrigin={{
                        vertical: 'bottom',
                        horizontal: 'center',
                    }}
                >
                    <MenuList>
                        {user ? (
                            <>
                                <MenuItem
                                    component={Link}
                                    href={`/me/${user._id}`}
                                    onClick={dismissHandler}
                                >
                                    <ListItemIcon>
                                        <AccountIcon fontSize="small" />
                                    </ListItemIcon>
                                    <ListItemText>我的主页</ListItemText>
                                </MenuItem>
                                <MenuItem onClick={handleLogout}>
                                    <ListItemIcon>
                                        <LogoutIcon fontSize="small" />
                                    </ListItemIcon>
                                    <ListItemText>退出账号</ListItemText>
                                </MenuItem>
                            </>
                        ) : (
                            <MenuItem
                                component={Link}
                                href="/login"
                                onClick={() => {
                                    dismissHandler()
                                    localStorage.setItem(
                                        'login_from',
                                        router.pathname
                                    )
                                }}
                            >
                                <ListItemIcon>
                                    <LoginIcon fontSize="small" />
                                </ListItemIcon>
                                <ListItemText>登录</ListItemText>
                            </MenuItem>
                        )}
                    </MenuList>
                </Menu>
            </Toolbar>
        </AppBar>
    )
}

function LanguageSwitch(props: {
    settings: LanguageSettings
    onSwitched: (target: string) => void
    color?: IconButtonTypeMap['props']['color']
}) {
    const theme = useTheme()
    const [open, setOpen] = useState(false)
    const icon = useRef(null)

    return (
        <>
            <Tooltip title="语言">
                <span>
                    <IconButton
                        sx={{
                            [theme.breakpoints.up('md')]: { display: 'none' },
                        }}
                        onClick={() => setOpen(true)}
                        ref={icon}
                        color={props.color}
                    >
                        <LanguageIcon />
                    </IconButton>
                </span>
            </Tooltip>
            <Popover
                open={open}
                onClose={() => setOpen(false)}
                anchorEl={icon.current}
                transformOrigin={{
                    vertical: 'top',
                    horizontal: 'right',
                }}
                anchorOrigin={{
                    vertical: 'bottom',
                    horizontal: 'right',
                }}
            >
                <Caption noWrap mt={2} mb={-1} ml={2} mr={2}>
                    在其他语言中查看
                </Caption>
                <List>
                    {props.settings.available.map(({ name, href }) => (
                        <ListItemButton
                            key={name}
                            onClick={() => {
                                setOpen(false)
                                props.onSwitched(name)
                            }}
                            selected={props.settings.current === name}
                            component={Link}
                            href={href}
                        >
                            {getLanguageName(name)}
                        </ListItemButton>
                    ))}
                </List>
            </Popover>
        </>
    )
}
