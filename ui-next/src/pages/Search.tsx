import { useEffect, useState } from 'react';
import { source } from '../lib/source';
import { useAsync } from '../lib/useAsync';
import { navigate } from '../lib/router';
import { Img } from '../components/Img';
import { Icon } from '../components/Icon';
import { PlayButton } from '../components/PlayButton';
import { ArtistLinks } from '../components/Links';
import { Shelf } from '../components/Card';
import { TrackList } from '../components/TrackList';
import { AlbumCard, ArtistCard, PlaylistCard } from './Home';
import { player, usePlayer } from '../state/player';
import { playEntity } from '../lib/actions';
import type { SearchResults } from '../lib/types';

const GENRES: [string, string][] = [
    ['Pop', '#dc148c'],
    ['Hip-Hop', '#bc5900'],
    ['Rock', '#e91429'],
    ['Indie', '#608108'],
    ['Electronic', '#0d73ec'],
    ['R&B', '#8d67ab'],
    ['Jazz', '#1e3264'],
    ['Classical', '#7d4b32'],
    ['Lo-fi', '#477d95'],
    ['Metal', '#535353'],
    ['Country', '#ba5d07'],
    ['Latin', '#e1118c'],
    ['K-Pop', '#148a08'],
    ['Soul', '#a56752'],
    ['Ambient', '#2d46b9'],
    ['Workout', '#777777'],
    ['Chill', '#509bf5'],
    ['Party', '#af2896'],
    ['Sleep', '#1e3264'],
    ['Focus', '#503750'],
];

type Tab = 'all' | 'songs' | 'artists' | 'albums' | 'playlists';
const RECENT_KEY = 'ui-next:recent-searches';

function recentSearches(): string[] {
    try {
        return JSON.parse(localStorage.getItem(RECENT_KEY) || '[]');
    } catch {
        return [];
    }
}

export function Search({ query }: { query: string }) {
    const [tab, setTab] = useState<Tab>('all');
    const q = query.trim();
    const results = useAsync<SearchResults | null>((signal) => (q ? source.search(q, signal) : Promise.resolve(null)), [q]);

    useEffect(() => setTab('all'), [q]);
    useEffect(() => {
        if (!q || !results.data) return;
        const list = [q, ...recentSearches().filter((x) => x.toLowerCase() !== q.toLowerCase())].slice(0, 8);
        localStorage.setItem(RECENT_KEY, JSON.stringify(list));
    }, [q, results.data]);

    if (!q) return <Browse />;

    const r = results.data;
    const empty = r && !r.tracks.length && !r.albums.length && !r.artists.length && !r.playlists.length;

    return (
        <div className="search-page">
            <div className="chips sticky-chips" role="tablist">
                {(['all', 'songs', 'artists', 'albums', 'playlists'] as Tab[]).map((t) => (
                    <button key={t} role="tab" aria-selected={tab === t} className={`chip ${tab === t ? 'on' : ''}`} onClick={() => setTab(t)}>
                        {t === 'all' ? 'All' : t[0].toUpperCase() + t.slice(1)}
                    </button>
                ))}
            </div>
            {results.loading && <div className="spinner" aria-label="Searching" />}
            {results.error && <p className="muted pad">Search failed. Check your connection and try again.</p>}
            {empty && (
                <div className="empty-state">
                    <h2>No results found for "{q}"</h2>
                    <p>Check the spelling, or try fewer or different keywords.</p>
                </div>
            )}
            {r && !empty && tab === 'all' && <AllResults r={r} q={q} />}
            {r && tab === 'songs' && <TrackList tracks={r.tracks} context={{ kind: 'search', id: q, title: `Search: ${q}` }} />}
            {r && tab === 'artists' && (
                <div className="card-grid">
                    {r.artists.map((a) => (
                        <ArtistCard key={a.id} artist={a} />
                    ))}
                </div>
            )}
            {r && tab === 'albums' && (
                <div className="card-grid">
                    {r.albums.map((a) => (
                        <AlbumCard key={a.id} album={a} />
                    ))}
                </div>
            )}
            {r && tab === 'playlists' && (
                <div className="card-grid">
                    {r.playlists.map((p) => (
                        <PlaylistCard key={p.id} playlist={p} />
                    ))}
                </div>
            )}
        </div>
    );
}

function AllResults({ r, q }: { r: SearchResults; q: string }) {
    const lower = q.toLowerCase();
    const artist = r.artists.find((a) => a.name.toLowerCase() === lower);
    const album = r.albums.find((a) => a.title.toLowerCase() === lower);
    const top = artist
        ? ({ kind: 'artist', id: artist.id, title: artist.name, image: artist.picture, label: 'Artist', artists: [] } as const)
        : album
          ? ({ kind: 'album', id: album.id, title: album.title, image: album.cover, label: 'Album', artists: album.artists } as const)
          : r.tracks[0]
            ? ({ kind: 'track', id: r.tracks[0].id, title: r.tracks[0].title, image: r.tracks[0].cover, label: 'Song', artists: r.tracks[0].artists } as const)
            : r.artists[0]
              ? ({ kind: 'artist', id: r.artists[0].id, title: r.artists[0].name, image: r.artists[0].picture, label: 'Artist', artists: [] } as const)
              : null;
    const ctx = { kind: 'search' as const, id: q, title: `Search: ${q}` };
    const playing = usePlayer((s) => s.playing && (top?.kind === 'track' ? s.current?.id === top.id : s.context?.kind === top?.kind && s.context?.id === top?.id));

    return (
        <>
            <div className="top-row">
                {top && (
                    <section className="top-result">
                        <h2>Top result</h2>
                        <div
                            className="top-card"
                            role="link"
                            tabIndex={0}
                            onClick={() =>
                                top.kind === 'track'
                                    ? r.tracks[0].album?.id && navigate({ name: 'album', id: r.tracks[0].album.id })
                                    : navigate({ name: top.kind, id: top.id })
                            }
                        >
                            <Img id={top.image} size={320} round={top.kind === 'artist'} />
                            <h3>{top.title}</h3>
                            <div className="top-sub">
                                <span className="top-kind">{top.label}</span>
                                {top.artists.length > 0 && <ArtistLinks artists={[...top.artists]} />}
                            </div>
                            <PlayButton
                                className="card-play"
                                size={48}
                                playing={playing}
                                onClick={() => (top.kind === 'track' ? (playing ? player.toggle() : player.playList(r.tracks, 0, ctx)) : playEntity(top.kind, top.id, top.title))}
                            />
                        </div>
                    </section>
                )}
                {r.tracks.length > 0 && (
                    <section className="top-songs">
                        <h2>Songs</h2>
                        <TrackList tracks={r.tracks.slice(0, 4)} context={ctx} showAlbum={false} showHeader={false} numbered={false} />
                    </section>
                )}
            </div>
            {r.artists.length > 0 && (
                <Shelf title="Artists">
                    {r.artists.slice(0, 10).map((a) => (
                        <ArtistCard key={a.id} artist={a} />
                    ))}
                </Shelf>
            )}
            {r.albums.length > 0 && (
                <Shelf title="Albums">
                    {r.albums.slice(0, 10).map((a) => (
                        <AlbumCard key={a.id} album={a} />
                    ))}
                </Shelf>
            )}
            {r.playlists.length > 0 && (
                <Shelf title="Playlists">
                    {r.playlists.slice(0, 10).map((p) => (
                        <PlaylistCard key={p.id} playlist={p} />
                    ))}
                </Shelf>
            )}
        </>
    );
}

function Browse() {
    const [recent, setRecent] = useState(recentSearches);
    return (
        <div className="browse">
            {recent.length > 0 && (
                <section className="recent-searches">
                    <h2>Recent searches</h2>
                    <div className="chips wrap">
                        {recent.map((s) => (
                            <span key={s} className="chip recent">
                                <button onClick={() => navigate({ name: 'search', query: s })}>{s}</button>
                                <button
                                    className="x"
                                    aria-label={`Remove ${s}`}
                                    onClick={() => {
                                        const next = recent.filter((x) => x !== s);
                                        localStorage.setItem(RECENT_KEY, JSON.stringify(next));
                                        setRecent(next);
                                    }}
                                >
                                    <Icon name="close" size={12} />
                                </button>
                            </span>
                        ))}
                    </div>
                </section>
            )}
            <h2>Browse all</h2>
            <div className="genre-grid">
                {GENRES.map(([name, color], i) => (
                    <button key={name} className="genre" style={{ background: color }} onClick={() => navigate({ name: 'search', query: name })}>
                        <span>{name}</span>
                        <i className="genre-shape" style={{ transform: `rotate(${i % 2 ? 25 : -25}deg)` }} />
                    </button>
                ))}
            </div>
        </div>
    );
}
