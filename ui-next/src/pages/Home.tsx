import { useMemo, useState } from 'react';
import { Card, Shelf, SkeletonShelf } from '../components/Card';
import { Img } from '../components/Img';
import { Icon } from '../components/Icon';
import { PlayButton } from '../components/PlayButton';
import { useLibrary } from '../state/library';
import { usePlayer } from '../state/player';
import { useLibraryEntries } from '../components/Sidebar';
import { greeting, year } from '../lib/format';
import { navigate } from '../lib/router';
import { playEntity, entityMenu } from '../lib/actions';
import { openMenu } from '../state/menu';
import { source } from '../lib/source';
import { DemoSource } from '../lib/demo-source';
import { useAsync } from '../lib/useAsync';
import { useDominantColor } from '../lib/color';
import type { Album, Artist, Playlist, Track } from '../lib/types';

/** Curated searches that seed the home page when there is no listening history yet. */
const SEEDS = [
    { title: 'Popular right now', query: 'Top Hits' },
    { title: 'Chill vibes', query: 'Chill' },
    { title: 'Focus', query: 'Focus' },
    { title: 'Throwbacks', query: '2000s' },
];

function uniqueAlbums(tracks: Track[]): Album[] {
    const seen = new Set<string>();
    const out: Album[] = [];
    for (const t of tracks) {
        if (!t.album?.id || seen.has(t.album.id)) continue;
        seen.add(t.album.id);
        out.push({ id: t.album.id, title: t.album.title, cover: t.album.cover ?? t.cover, artists: t.artists });
    }
    return out;
}

export function Home() {
    const entries = useLibraryEntries();
    const recents = useLibrary((s) => s.recents);
    const seed = useLibrary((s) => s.history[0] ?? null);
    const [hover, setHover] = useState<string | null>(null);
    const quick = entries
        .filter((e) => e.kind !== 'liked' || e.subtitle !== 'Playlist • 0 songs')
        .sort((a, b) => (b.sortAt === Infinity ? 1 : b.sortAt) - (a.sortAt === Infinity ? 1 : a.sortAt))
        .slice(0, 8);
    const tint = useDominantColor(source.image(hover ?? quick[0]?.image, 160));

    const featured = useAsync(async () => {
        if (source instanceof DemoSource) {
            const f = source.featured();
            return [
                { title: 'Popular albums', albums: f.albums.filter((a) => a.type === 'ALBUM'), playlists: [], artists: [] },
                { title: 'Playlists for you', albums: [], playlists: f.playlists, artists: [] },
                { title: 'Popular artists', albums: [], playlists: [], artists: f.artists },
            ];
        }
        const rows = await Promise.all(
            SEEDS.map(async (s) => {
                const r = await source.search(s.query).catch(() => null);
                return { title: s.title, albums: r?.albums ?? [], playlists: r?.playlists ?? [], artists: [] as Artist[] };
            })
        );
        return rows.filter((r) => r.albums.length || r.playlists.length);
    }, []);

    const forYou = useAsync(async () => (seed ? uniqueAlbums(await source.getRecommendations(seed)) : []), [seed?.id]);

    return (
        <div className="home" style={{ '--hdr': tint } as React.CSSProperties}>
            <div className="home-tint" />
            <h1 className="home-greeting">{greeting()}</h1>

            {quick.length > 0 && (
                <div className="quick-grid">
                    {quick.map((e) => (
                        <QuickTile key={e.kind + e.id} entry={e} onHover={setHover} />
                    ))}
                </div>
            )}

            {forYou.data && forYou.data.length > 0 && seed && (
                <Shelf title={`More like ${seed.artists[0]?.name ?? seed.title}`}>
                    {forYou.data.slice(0, 12).map((a) => (
                        <AlbumCard key={a.id} album={a} />
                    ))}
                </Shelf>
            )}

            {recents.length > 0 && (
                <Shelf title="Recently visited">
                    {recents.slice(0, 12).map((r) => (
                        <Card
                            key={r.kind + r.id}
                            kind={r.kind}
                            id={r.id}
                            title={r.title}
                            subtitle={r.subtitle}
                            image={r.image}
                            route={r.kind === 'liked' ? { name: 'liked' } : { name: r.kind, id: r.id }}
                        />
                    ))}
                </Shelf>
            )}

            {featured.loading && (
                <>
                    <SkeletonShelf />
                    <SkeletonShelf />
                </>
            )}
            {featured.data?.map((row) => (
                <Shelf key={row.title} title={row.title}>
                    {row.playlists.slice(0, 12).map((p) => (
                        <PlaylistCard key={p.id} playlist={p} />
                    ))}
                    {row.albums.slice(0, 12).map((a) => (
                        <AlbumCard key={a.id} album={a} />
                    ))}
                    {row.artists.slice(0, 12).map((a) => (
                        <ArtistCard key={a.id} artist={a} />
                    ))}
                </Shelf>
            ))}
            {featured.data?.length === 0 && !quick.length && (
                <div className="empty-state">
                    <Icon name="search" size={48} />
                    <h2>Find something to play</h2>
                    <p>Search for an artist, song or album to start filling your library.</p>
                    <button className="btn-light" onClick={() => navigate({ name: 'search', query: '' })}>
                        Search
                    </button>
                </div>
            )}
        </div>
    );
}

function QuickTile({ entry: e, onHover }: { entry: ReturnType<typeof useLibraryEntries>[number]; onHover: (img: string | null) => void }) {
    const playing = usePlayer((s) => s.playing && s.context?.kind === e.kind && s.context.id === e.id);
    return (
        <div
            className="quick-tile"
            role="link"
            tabIndex={0}
            onClick={() => navigate(e.route)}
            onKeyDown={(ev) => ev.key === 'Enter' && navigate(e.route)}
            onMouseEnter={() => onHover(e.image)}
            onContextMenu={(ev) => e.kind !== 'liked' && openMenu(ev, entityMenu(e.kind, e.id, e.title))}
        >
            {e.kind === 'liked' ? (
                <div className="img liked-art">
                    <Icon name="heartFill" size={20} />
                </div>
            ) : (
                <Img id={e.image} size={160} round={e.kind === 'artist'} />
            )}
            <span className="qt-title">{e.title}</span>
            <PlayButton className={`qt-play ${playing ? 'on' : ''}`} size={36} playing={playing} onClick={() => playEntity(e.kind, e.id, e.title)} />
        </div>
    );
}

export function AlbumCard({ album, sub }: { album: Album; sub?: string }) {
    return (
        <Card
            kind="album"
            id={album.id}
            title={album.title}
            subtitle={sub ?? album.artists.map((a) => a.name).join(', ')}
            image={album.cover}
            route={{ name: 'album', id: album.id }}
            entity={album}
        />
    );
}

export function AlbumYearCard({ album }: { album: Album }) {
    const type = useMemo(() => (album.type === 'EP' ? 'EP' : album.type === 'SINGLE' ? 'Single' : 'Album'), [album.type]);
    return <AlbumCard album={album} sub={[year(album.releaseDate), type].filter(Boolean).join(' • ')} />;
}

export function PlaylistCard({ playlist }: { playlist: Playlist }) {
    return (
        <Card
            kind="playlist"
            id={playlist.id}
            title={playlist.title}
            subtitle={playlist.description ? stripHtml(playlist.description) : `By ${playlist.owner ?? 'Monochrome'}`}
            image={playlist.cover}
            route={{ name: 'playlist', id: playlist.id }}
            entity={playlist}
        />
    );
}

export function ArtistCard({ artist }: { artist: Artist }) {
    return <Card kind="artist" id={artist.id} title={artist.name} subtitle="Artist" image={artist.picture} route={{ name: 'artist', id: artist.id }} entity={artist} />;
}

export const stripHtml = (s: string) => s.replace(/<[^>]+>/g, '');
