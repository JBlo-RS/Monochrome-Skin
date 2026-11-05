import { useMemo, useState } from 'react';
import { Icon } from './Icon';
import { Img } from './Img';
import { library, useLibrary } from '../state/library';
import { usePlayer } from '../state/player';
import { href, navigate, type Route } from '../lib/router';
import { openMenu } from '../state/menu';
import { entityMenu, type EntityKind } from '../lib/actions';
import { plural } from '../lib/format';

type Filter = 'all' | 'playlist' | 'album' | 'artist';
interface Entry {
    kind: EntityKind;
    id: string;
    title: string;
    subtitle: string;
    image: string | null;
    route: Route;
    sortAt: number;
    pinned?: boolean;
}

export function useLibraryEntries(): Entry[] {
    const lib = useLibrary((s) => s);
    return useMemo(() => {
        const seen = new Map(lib.recents.map((r) => [`${r.kind}:${r.id}`, r.at]));
        const at = (k: string, id: string, fallback: number) => seen.get(`${k}:${id}`) ?? fallback;
        const list: Entry[] = [
            {
                kind: 'liked',
                id: 'liked',
                title: 'Liked Songs',
                subtitle: `Playlist • ${plural(lib.liked.length, 'song')}`,
                image: null,
                route: { name: 'liked' },
                sortAt: Infinity,
                pinned: true,
            },
            ...lib.mine.map((p) => ({
                kind: 'my-playlist' as const,
                id: p.id,
                title: p.title,
                subtitle: `Playlist • You`,
                image: p.tracks[0]?.cover ?? null,
                route: { name: 'my-playlist' as const, id: p.id },
                sortAt: at('my-playlist', p.id, p.createdAt),
            })),
            ...lib.playlists.map((p) => ({
                kind: 'playlist' as const,
                id: p.id,
                title: p.title,
                subtitle: `Playlist • ${p.owner ?? 'Monochrome'}`,
                image: p.cover,
                route: { name: 'playlist' as const, id: p.id },
                sortAt: at('playlist', p.id, p.addedAt),
            })),
            ...lib.albums.map((a) => ({
                kind: 'album' as const,
                id: a.id,
                title: a.title,
                subtitle: `Album • ${a.artists.map((x) => x.name).join(', ')}`,
                image: a.cover,
                route: { name: 'album' as const, id: a.id },
                sortAt: at('album', a.id, a.addedAt),
            })),
            ...lib.artists.map((a) => ({
                kind: 'artist' as const,
                id: a.id,
                title: a.name,
                subtitle: 'Artist',
                image: a.picture,
                route: { name: 'artist' as const, id: a.id },
                sortAt: at('artist', a.id, a.addedAt),
            })),
        ];
        return list;
    }, [lib]);
}

export function Sidebar({ collapsed, onToggle }: { collapsed: boolean; onToggle: () => void }) {
    const entries = useLibraryEntries();
    const [filter, setFilter] = useState<Filter>('all');
    const [query, setQuery] = useState('');
    const [searching, setSearching] = useState(false);
    const [sort, setSort] = useState<'recent' | 'alpha'>('recent');
    const ctx = usePlayer((s) => s.context);
    const playing = usePlayer((s) => s.playing);
    const current = location.hash;

    const visible = entries
        .filter((e) => filter === 'all' || e.kind === filter || (filter === 'playlist' && (e.kind === 'my-playlist' || e.kind === 'liked')))
        .filter((e) => !query || e.title.toLowerCase().includes(query.toLowerCase()))
        .sort((a, b) => (a.pinned ? -1 : b.pinned ? 1 : sort === 'alpha' ? a.title.localeCompare(b.title) : b.sortAt - a.sortAt));

    const create = () => {
        const p = library.createPlaylist();
        navigate({ name: 'my-playlist', id: p.id });
    };

    return (
        <aside className={`sidebar panel ${collapsed ? 'collapsed' : ''}`} aria-label="Your Library">
            <header className="lib-head">
                <button className="lib-title" onClick={onToggle} title={collapsed ? 'Expand Your Library' : 'Collapse Your Library'}>
                    <Icon name="library" />
                    {!collapsed && <span>Your Library</span>}
                </button>
                {!collapsed && (
                    <button className="icon-btn pill-btn" onClick={create} title="Create playlist">
                        <Icon name="plus" size={16} />
                        <span>Create</span>
                    </button>
                )}
            </header>
            {!collapsed && (
                <>
                    <div className="chips" role="tablist">
                        {filter !== 'all' && (
                            <button className="chip close" onClick={() => setFilter('all')} aria-label="Clear filter">
                                <Icon name="close" size={14} />
                            </button>
                        )}
                        {(['playlist', 'album', 'artist'] as const)
                            .filter((f) => filter === 'all' || filter === f)
                            .map((f) => (
                                <button key={f} role="tab" aria-selected={filter === f} className={`chip ${filter === f ? 'on' : ''}`} onClick={() => setFilter(filter === f ? 'all' : f)}>
                                    {f === 'playlist' ? 'Playlists' : f === 'album' ? 'Albums' : 'Artists'}
                                </button>
                            ))}
                    </div>
                    <div className="lib-tools">
                        <div className={`lib-search ${searching || query ? 'open' : ''}`}>
                            <button className="icon-btn" onClick={() => setSearching(true)} aria-label="Search in Your Library">
                                <Icon name="search" size={16} />
                            </button>
                            {(searching || query) && (
                                <input autoFocus placeholder="Search in Your Library" value={query} onChange={(e) => setQuery(e.target.value)} onBlur={() => setSearching(false)} />
                            )}
                        </div>
                        <button className="lib-sort" onClick={() => setSort(sort === 'recent' ? 'alpha' : 'recent')}>
                            {sort === 'recent' ? 'Recents' : 'Alphabetical'} <Icon name="list" size={14} />
                        </button>
                    </div>
                </>
            )}
            <ul className="lib-list">
                {visible.map((e) => {
                    const active = current === href(e.route);
                    const isPlaying = playing && ctx?.kind === e.kind && ctx.id === e.id;
                    return (
                        <li key={`${e.kind}:${e.id}`}>
                            <a
                                href={href(e.route)}
                                className={`lib-item ${active ? 'active' : ''}`}
                                title={collapsed ? e.title : undefined}
                                onContextMenu={(ev) => e.kind !== 'liked' && openMenu(ev, entityMenu(e.kind, e.id, e.title))}
                            >
                                {e.kind === 'liked' ? (
                                    <div className="img liked-art">
                                        <Icon name="heartFill" size={18} />
                                    </div>
                                ) : (
                                    <Img id={e.image} size={160} round={e.kind === 'artist'} fallback={e.kind === 'artist' ? 'user' : 'note'} />
                                )}
                                {!collapsed && (
                                    <span className="lib-text">
                                        <span className={`lib-name ${isPlaying ? 'playing' : ''}`}>{e.title}</span>
                                        <span className="lib-sub">
                                            {e.pinned && <Icon name="check" size={12} className="pin" />}
                                            {e.subtitle}
                                        </span>
                                    </span>
                                )}
                                {!collapsed && isPlaying && <Icon name="volume" size={16} className="lib-playing" />}
                            </a>
                        </li>
                    );
                })}
                {!collapsed && visible.length === 1 && !query && filter === 'all' && (
                    <li className="lib-empty">
                        <strong>Create your first playlist</strong>
                        <span>It's easy, we'll help you.</span>
                        <button className="btn-light" onClick={create}>
                            Create playlist
                        </button>
                    </li>
                )}
            </ul>
        </aside>
    );
}
