import { useEffect, useRef, useState } from 'react';
import { useRoute, type Route } from './lib/router';
import { TopBar } from './components/TopBar';
import { Sidebar } from './components/Sidebar';
import { PlayerBar, type Panel } from './components/PlayerBar';
import { SidePanel } from './components/SidePanel';
import { FullPlayer, MiniPlayer } from './components/FullPlayer';
import { ContextMenu } from './components/ContextMenu';
import { Toasts } from './components/Toasts';
import { Icon } from './components/Icon';
import { Home } from './pages/Home';
import { Search } from './pages/Search';
import { AlbumPage } from './pages/Album';
import { ArtistPage } from './pages/Artist';
import { LikedPage, MyPlaylistPage, PlaylistPage } from './pages/Playlist';
import { LibraryPage, NotFound, SettingsPage } from './pages/Misc';
import { player, usePlayer } from './state/player';

function Page({ route }: { route: Route }) {
    switch (route.name) {
        case 'home':
            return <Home />;
        case 'search':
            return <Search query={route.query} />;
        case 'album':
            return <AlbumPage id={route.id} />;
        case 'artist':
            return <ArtistPage id={route.id} />;
        case 'playlist':
            return <PlaylistPage id={route.id} />;
        case 'my-playlist':
            return <MyPlaylistPage id={route.id} />;
        case 'liked':
            return <LikedPage />;
        case 'library':
            return <LibraryPage />;
        case 'settings':
            return <SettingsPage />;
        default:
            return <NotFound />;
    }
}

const stored = <T,>(key: string, fallback: T): T => {
    try {
        const v = localStorage.getItem(key);
        return v === null ? fallback : (JSON.parse(v) as T);
    } catch {
        return fallback;
    }
};

function useMedia(query: string) {
    const [match, setMatch] = useState(() => matchMedia(query).matches);
    useEffect(() => {
        const mq = matchMedia(query);
        const on = () => setMatch(mq.matches);
        mq.addEventListener('change', on);
        return () => mq.removeEventListener('change', on);
    }, [query]);
    return match;
}

export function App() {
    const route = useRoute();
    const main = useRef<HTMLDivElement>(null);
    const [panel, setPanelState] = useState<Panel>(() => stored<Panel>('ui-next:panel', 'now'));
    const [collapsed, setCollapsed] = useState(() => stored('ui-next:sidebar-collapsed', false));
    const [full, setFull] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const hasTrack = usePlayer((s) => !!s.current);
    const mobile = useMedia('(max-width: 720px)');
    // On phones the panel is a full-screen sheet, so it only opens when asked for.
    const [mobilePanel, setMobilePanel] = useState<Panel>(null);

    const setPanel = (p: Panel) => {
        if (mobile) return setMobilePanel(p);
        setPanelState(p);
        localStorage.setItem('ui-next:panel', JSON.stringify(p));
    };
    const activePanel = mobile ? mobilePanel : panel;

    useEffect(() => {
        main.current?.scrollTo({ top: 0 });
        setScrolled(false);
        setFull(false);
        setMobilePanel(null);
    }, [route]);

    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            const t = e.target as HTMLElement;
            if (t.closest('input, textarea, select, [contenteditable="true"]')) return;
            if (e.code === 'Space' && !t.closest('button, [role="slider"]')) {
                e.preventDefault();
                player.toggle();
            } else if ((e.ctrlKey || e.metaKey) && e.key === 'ArrowRight') player.next();
            else if ((e.ctrlKey || e.metaKey) && e.key === 'ArrowLeft') player.prev();
            else if (e.shiftKey && e.key === 'ArrowRight') player.seek(player.get().time + 10);
            else if (e.shiftKey && e.key === 'ArrowLeft') player.seek(Math.max(0, player.get().time - 10));
        };
        addEventListener('keydown', onKey);
        return () => removeEventListener('keydown', onKey);
    }, []);

    const showPanel = activePanel && hasTrack;
    const tab = route.name === 'search' ? 'search' : route.name === 'library' ? 'library' : route.name === 'home' ? 'home' : null;

    return (
        <div className={`app ${collapsed ? 'lib-collapsed' : ''} ${showPanel ? 'with-panel' : ''} ${hasTrack ? 'has-track' : ''}`}>
            <TopBar />
            <Sidebar
                collapsed={collapsed}
                onToggle={() => {
                    setCollapsed(!collapsed);
                    localStorage.setItem('ui-next:sidebar-collapsed', JSON.stringify(!collapsed));
                }}
            />
            <main className={`main panel ${scrolled ? 'scrolled' : ''}`} ref={main} onScroll={(e) => setScrolled(e.currentTarget.scrollTop > 8)}>
                <Page route={route} />
                <div className="main-pad" />
            </main>
            {showPanel && <SidePanel panel={activePanel} onClose={() => setPanel(null)} />}
            <PlayerBar panel={activePanel} setPanel={setPanel} onExpand={() => hasTrack && setFull(true)} />

            <div className="mobile-dock">
                <MiniPlayer onExpand={() => setFull(true)} />
                <nav className="mobile-nav" aria-label="Main">
                    <a href="#/" className={tab === 'home' ? 'on' : ''}>
                        <Icon name={tab === 'home' ? 'home' : 'homeOutline'} />
                        <span>Home</span>
                    </a>
                    <a href="#/search" className={tab === 'search' ? 'on' : ''}>
                        <Icon name="search" />
                        <span>Search</span>
                    </a>
                    <a href="#/library" className={tab === 'library' ? 'on' : ''}>
                        <Icon name="library" />
                        <span>Your Library</span>
                    </a>
                </nav>
            </div>

            {full && (
                <FullPlayer
                    onClose={() => setFull(false)}
                    onQueue={() => {
                        setFull(false);
                        setPanel('queue');
                    }}
                />
            )}
            <ContextMenu />
            <Toasts />
        </div>
    );
}
