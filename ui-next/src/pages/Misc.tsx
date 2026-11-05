import { useState } from 'react';
import { Img } from '../components/Img';
import { Icon } from '../components/Icon';
import { useLibraryEntries } from '../components/Sidebar';
import { href, navigate } from '../lib/router';
import { library } from '../state/library';
import { player, usePlayer } from '../state/player';
import { isDemo, setDemo } from '../lib/source';
import { toast } from '../state/toast';

/** Full-page library list, used on phones where the sidebar is hidden. */
export function LibraryPage() {
    const entries = useLibraryEntries();
    const [filter, setFilter] = useState<'all' | 'playlist' | 'album' | 'artist'>('all');
    const list = entries.filter((e) => filter === 'all' || e.kind === filter || (filter === 'playlist' && (e.kind === 'my-playlist' || e.kind === 'liked')));
    return (
        <div className="library-page">
            <header className="lp-head">
                <h1>Your Library</h1>
                <button
                    className="round-btn ghost"
                    aria-label="Create playlist"
                    onClick={() => {
                        const p = library.createPlaylist();
                        navigate({ name: 'my-playlist', id: p.id });
                    }}
                >
                    <Icon name="plus" />
                </button>
            </header>
            <div className="chips">
                {(['playlist', 'album', 'artist'] as const).map((f) => (
                    <button key={f} className={`chip ${filter === f ? 'on' : ''}`} onClick={() => setFilter(filter === f ? 'all' : f)}>
                        {f === 'playlist' ? 'Playlists' : f === 'album' ? 'Albums' : 'Artists'}
                    </button>
                ))}
            </div>
            <ul className="lib-list">
                {list.map((e) => (
                    <li key={e.kind + e.id}>
                        <a className="lib-item" href={href(e.route)}>
                            {e.kind === 'liked' ? (
                                <div className="img liked-art">
                                    <Icon name="heartFill" size={22} />
                                </div>
                            ) : (
                                <Img id={e.image} size={160} round={e.kind === 'artist'} />
                            )}
                            <span className="lib-text">
                                <span className="lib-name">{e.title}</span>
                                <span className="lib-sub">{e.subtitle}</span>
                            </span>
                        </a>
                    </li>
                ))}
            </ul>
        </div>
    );
}

const QUALITIES: [string, string][] = [
    ['HI_RES_LOSSLESS', 'Hi-Res Lossless (up to 24-bit/192kHz)'],
    ['LOSSLESS', 'Lossless (16-bit/44.1kHz FLAC)'],
    ['HIGH', 'High (320kbps AAC)'],
    ['LOW', 'Data saver (96kbps AAC)'],
];

export function SettingsPage() {
    const [quality, setQuality] = useState(localStorage.getItem('playback-quality') || 'LOSSLESS');
    const autoplay = usePlayer((s) => s.autoplay);
    return (
        <div className="settings-page">
            <h1>Settings</h1>
            <section>
                <h2>Audio quality</h2>
                <label className="setting">
                    <span>
                        <strong>Streaming quality</strong>
                        <small>Higher quality uses more data. Applies from the next song.</small>
                    </span>
                    <select
                        value={quality}
                        onChange={(e) => {
                            setQuality(e.target.value);
                            localStorage.setItem('playback-quality', e.target.value);
                        }}
                    >
                        {QUALITIES.map(([v, l]) => (
                            <option key={v} value={v}>
                                {l}
                            </option>
                        ))}
                    </select>
                </label>
            </section>
            <section>
                <h2>Playback</h2>
                <label className="setting">
                    <span>
                        <strong>Autoplay</strong>
                        <small>Keep listening to similar songs when your music ends.</small>
                    </span>
                    <input type="checkbox" className="switch" checked={autoplay} onChange={player.toggleAutoplay} />
                </label>
            </section>
            <section>
                <h2>Data</h2>
                <label className="setting">
                    <span>
                        <strong>Demo catalogue</strong>
                        <small>Use built-in sample music instead of the live service. Handy for trying the interface offline.</small>
                    </span>
                    <input type="checkbox" className="switch" checked={isDemo} onChange={(e) => setDemo(e.target.checked)} />
                </label>
                <div className="setting">
                    <span>
                        <strong>Clear library</strong>
                        <small>Removes liked songs, saved items, your playlists and history from this browser.</small>
                    </span>
                    <button
                        className="btn-outline danger"
                        onClick={() => {
                            if (!confirm('Clear your whole library? This cannot be undone.')) return;
                            localStorage.removeItem('ui-next:library:v1');
                            localStorage.removeItem('ui-next:player:v1');
                            toast('Library cleared');
                            setTimeout(() => location.reload(), 600);
                        }}
                    >
                        Clear
                    </button>
                </div>
            </section>
            <section>
                <h2>About</h2>
                <p className="muted">
                    Monochrome Next is an alternative interface for Monochrome. Your library is stored locally in this browser.{' '}
                    <a className="link" href="../">
                        Open the classic interface
                    </a>
                    .
                </p>
            </section>
        </div>
    );
}

export function NotFound() {
    return (
        <div className="empty-state">
            <h2>Page not found</h2>
            <button className="btn-light" onClick={() => navigate({ name: 'home' })}>
                Go home
            </button>
        </div>
    );
}
