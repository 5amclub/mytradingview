'use client'
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Link from 'next/link';
import * as React from 'react';
import {
    matchPath,
    MemoryRouter,
    useLocation,
} from 'react-router-dom';

import AccountCircle from '@mui/icons-material/AccountCircle';
import MenuIcon from '@mui/icons-material/Menu';
import { AppBar, Button, Container, IconButton, Menu, MenuItem, Toolbar, Tooltip } from '@mui/material';
import PopupState, { bindMenu, bindTrigger } from 'material-ui-popup-state';
import { signIn, signOut } from 'next-auth/react';
import { forwardRef, Ref, useState } from 'react';
import { StaticRouter } from 'react-router-dom/server';

const NonPrefetchLink = forwardRef((props: any, ref: Ref<HTMLAnchorElement>) => <Link ref={ref} prefetch={false} {...props} />);
NonPrefetchLink.displayName = 'NonPrefetchLink';
/*
<Button><Link href="/" className=''>Home</Link></Button>
            <Button><Link href="/trades" className=''>Trades</Link></Button>
            <Button><Link href="/history">History</Link></Button>
*/

const pages = [
    { title: 'Home', href: '/' },
    { title: 'Trades', href: '/trades' },
    { title: 'Option analyzer', href: '/options/analyze' },
    {
        title: 'Option analyzer 2', href: '', children: [
            { title: 'Option analyzer 2', href: '/options/analyze-2' },
            { title: 'Option analyzer NET Gamma', href: '/options/analyze-net-gamma' },
            { title: 'Option analyzer Table', href: '/options/analyze-options-table' },
        ]
    },
    { title: 'Option pricing', href: '/options/pricing' },
    { title: 'History', href: '/history' },
    { title: 'Seasonal', href: '/seasonal' },
    { title: 'Greeks Report', href: '/reports/OptionGreeksSummary' },
    { title: 'Calculator', href: '/calculator' }
];
const settings = ['Profile', 'Logout'];

function Router(props: { children?: React.ReactNode }) {
    const { children } = props;
    if (typeof window === 'undefined') {
        return <StaticRouter location="/drafts">{children}</StaticRouter>;
    }

    return (
        <MemoryRouter initialEntries={['/drafts']} initialIndex={0}>
            {children}
        </MemoryRouter>
    );
}

function useRouteMatch(patterns: readonly string[]) {
    const { pathname } = useLocation();

    for (let i = 0; i < patterns.length; i += 1) {
        const pattern = patterns[i];
        const possibleMatch = matchPath(pattern, pathname);
        if (possibleMatch !== null) {
            return possibleMatch;
        }
    }

    return null;
}

// function MyTabs() {
//     // You need to provide the routes in descendant order.
//     // This means that if you have nested routes like:
//     // users, users/new, users/edit.
//     // Then the order should be ['users/add', 'users/edit', 'users'].
//     const routeMatch = useRouteMatch(['/inbox/:id', '/drafts', '/trash']);
//     const currentTab = routeMatch?.pattern?.path;

//     return (
//         // <Tabs value={currentTab}>
//         //   <Tab label="Inbox" value="/inbox/:id" to="/inbox/1" component={Link} />
//         //   <Tab label="Drafts" value="/drafts" to="/drafts" component={Link} />
//         //   <Tab label="Trash" value="/trash" to="/trash" component={Link} />
//         // </Tabs>
//         <ButtonGroup variant="contained" aria-label="Basic button group">
//             <Button><Link href="/" className=''>Home</Link></Button>
//             <Button><Link href="/trades" className=''>Trades</Link></Button>
//             <Button><Link href="/history">History</Link></Button>
//             <Button><Link href="/options/analyze">Option Analyzer</Link></Button>
//             <Button><Link href="/options/analyze">Option Analyzer</Link></Button>
//         </ButtonGroup>
//     );
// }

function CurrentRoute() {
    const location = useLocation();

    return (
        <Typography variant="body2" sx={{ pb: 2 }} color="text.secondary">
            Current route: {location.pathname}
        </Typography>
    );
}

export default function TabsRouter(props: { isAuthenticated: boolean }) {
    const [anchorElNav, setAnchorElNav] = useState<null | HTMLElement>(null);
    const [anchorElUser, setAnchorElUser] = useState<null | HTMLElement>(null);
    // const session = useSession();
    const { isAuthenticated } = props;

    const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);

    const open = Boolean(anchorEl);

    const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    const handleOpenNavMenu = (event: React.MouseEvent<HTMLElement>) => {
        setAnchorElNav(event.currentTarget);
    };
    const handleOpenUserMenu = (event: React.MouseEvent<HTMLElement>) => {
        setAnchorElUser(event.currentTarget);
    };

    const handleCloseNavMenu = () => {
        setAnchorElNav(null);
    };

    const handleCloseUserMenu = () => {
        setAnchorElUser(null);
    };

    const handleSignout = () => {
        handleCloseUserMenu();
        signOut();
    }

    return (
        <Router>
            <AppBar position="static" sx={{ margin: '0px 0px 0px 0px' }}>
                <Container maxWidth="xl">
                    <Toolbar disableGutters>
                        <Box sx={{ flexGrow: 1, display: { xs: 'flex', md: 'none' } }}>
                            <IconButton
                                size="large"
                                aria-label="account of current user"
                                aria-controls="menu-appbar"
                                aria-haspopup="true"
                                onClick={handleOpenNavMenu}
                                color="inherit"
                            >
                                <MenuIcon />
                            </IconButton>
                            <Menu
                                id="menu-appbar"
                                anchorEl={anchorElNav}
                                anchorOrigin={{
                                    vertical: 'bottom',
                                    horizontal: 'left',
                                }}
                                keepMounted
                                transformOrigin={{
                                    vertical: 'top',
                                    horizontal: 'left',
                                }}
                                open={Boolean(anchorElNav)}
                                onClose={handleCloseNavMenu}
                                sx={{
                                    display: { xs: 'block', md: 'none' },
                                }}
                            >
                                {pages.map((page) => (
                                    <MenuItem key={page.title} onClick={handleCloseNavMenu}>
                                        <Button LinkComponent={NonPrefetchLink} href={page.href}>
                                            <Typography textAlign="center">{page.title}</Typography>
                                        </Button>
                                    </MenuItem>
                                ))}
                            </Menu>
                        </Box>
                        <Box sx={{ flexGrow: 1, display: { xs: 'none', md: 'flex' } }}>
                            {pages.map((page) => (
                                <>
                                    {!page.children && (
                                        <Button
                                            key={page.title}
                                            // onClick={handleCloseNavMenu}
                                            href={page.href}
                                            LinkComponent={NonPrefetchLink}
                                            sx={{ my: 2, color: 'white', display: 'block' }}>
                                            {page.title}
                                        </Button>
                                    )}

                                    {page.children && (
                                        <PopupState variant="popover" popupId={page.title}>
                                            {(popupState) => (
                                                <React.Fragment>
                                                    <Button
                                                        key={page.title}
                                                        sx={{ my: 2, color: 'white', display: 'block' }}
                                                        {...bindTrigger(popupState)}
                                                    >
                                                        {page.title}
                                                    </Button>
                                                    <Menu {...bindMenu(popupState)}>
                                                        {page.children.map((child) => (
                                                            <MenuItem onClick={popupState.close} key={child.title}>
                                                                <Link
                                                                    key={child.title}
                                                                    style={{ textDecoration: "none", color: "black" }}
                                                                    href={child.href}
                                                                    {...bindTrigger(popupState)}
                                                                >
                                                                    {child.title}
                                                                </Link>
                                                            </MenuItem>
                                                        ))}
                                                    </Menu>
                                                </React.Fragment>
                                            )}
                                        </PopupState>
                                    )}
                                </>
                            ))}
                        </Box>

                        <Box sx={{ flexGrow: 0 }}>
                            <Tooltip title="User settings">
                                <IconButton onClick={handleOpenUserMenu} sx={{ p: 0 }}>
                                    <AccountCircle />
                                </IconButton>
                            </Tooltip>
                            <Menu
                                sx={{ mt: '45px' }}
                                id="menu-appbar"
                                anchorEl={anchorElUser}
                                anchorOrigin={{
                                    vertical: 'top',
                                    horizontal: 'right',
                                }}
                                keepMounted
                                transformOrigin={{
                                    vertical: 'top',
                                    horizontal: 'right',
                                }}
                                open={Boolean(anchorElUser)}
                                onClose={handleCloseUserMenu}
                            >
                                {/* {session.status == 'authenticated' ? ( */}
                                {isAuthenticated ? (
                                    <MenuItem key='signout' onClick={handleSignout}>
                                        <Typography textAlign="center">Sign Out</Typography>
                                    </MenuItem>
                                ) : (
                                    <MenuItem key='signout' onClick={() => signIn()}>
                                        <Typography textAlign="center">Sign In</Typography>
                                    </MenuItem>
                                )}
                            </Menu>
                        </Box>
                    </Toolbar>
                </Container>
            </AppBar>
        </Router >
    );
}