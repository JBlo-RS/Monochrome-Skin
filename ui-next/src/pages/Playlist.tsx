import { useEffect, useState } from 'react';
import { source } from '../lib/source';
import { useAsync } from '../lib/useAsync';
import { ActionBar, Dot, PageHeader, useHeaderColor } from '../components/PageHeader';
import { TrackList } from '../components/TrackList';
import { PlayButton } from '../components/PlayButton';
import { Icon } from '../components/Icon';
import { Img } from '../components/Img';
import { ArtistLinks } from '../components/Links';
import { usePlayer } from '../state/player';
import { library, useLibrary } from '../state/library';
import { openMenu } from '../state/menu';
import { toast } from '../state/toast';
import { entityMenu, playEntity, toggleSave } from '../lib/actions';
import { longDuration, plural } from '../lib/format';
import { navigate } from '../lib/router';
import { stripHtml } from './Home';
import { ErrorState, Loading } from './States';
import type { Track } from '../lib/types';

export function PlaylistPage({ id }: { id: string }) {
    const { data, error, loading } = useAsync(() => source.getPlaylist(id), [id]);
    const color = useHeaderColor(data?.playlist.cover);
    const saved = useLibrary((s) => s.playlists.some((p) => p.id === id));
    const playing = usePlayer((s) => s.playing && s.context?.kind === 'playlist' && s.context.id === id);

    useEffect(() => {
        if (data)
            library.visit({ kind: 'playlist', id, title: data.playlist.title, subtitle: `Playlist • ${data.playlist.owner ?? 'Monochrome'}`, image: data.playlist.cover });
    }, [data, id]);

    if (loading) return <Loading />;
    if (error || !data) return <ErrorState what="playlist" />;
    const { playlist, tracks } = data;
    const total = tracks.reduce((s, t) => s + t.duration, 0);

    return (
        <div className="entity-page">
            <PageHeader
                image={playlist.cover}
                kind="Playlist"
                title={playlist.title}
                color={color}
                meta={
                    <>
                        {playlist.description && <p className="ph-desc">{stripHtml(playlist.description)}</p>}
                        <span className="strong">{playlist.owner ?? 'Monochrome'}</span>
                        <Dot />
                        <span>
                            {plural(tracks.length, 'song')}, <span className="muted">{longDuration(total)}</span>
                        </span>
                    </>
                }
            />
            <ActionBar color={color}>
                <PlayButton playing={playing} onClick={() => playEntity('playlist', id, playlist.title)} />
                <button className={`icon-btn save ${saved ? 'on' : ''}`} onClick={() => toggleSave('playlist', playlist)} aria-pressed={saved} aria-label={saved ? 'Remove from Your Library' : 'Save to Your Library'}>
                    <Icon name={saved ? 'checkCircle' : 'addCircle'} size={32} />
                </button>
                <button className="icon-btn" onClick={(e) => openMenu(e, entityMenu('playlist', id, playlist.title, playlist))} aria-label="More options">
                    <Icon name="more" size={32} />
                </button>
            </ActionBar>
            <div className="page-body">
                <TrackList tracks={tracks} context={{ kind: 'playlist', id, title: playlist.title }} />
            </div>
        </div>
    );
}

export function LikedPage() {
    const liked = useLibrary((s) => s.liked);
    const playing = usePlayer((s) => s.playing && s.context?.kind === 'liked');
    const color = 'rgb(80, 56, 160)';
    return (
        <div className="entity-page">
            <PageHeader
                image={null}
                imageNode={
                    <div className="img liked-art big">
                        <Icon name="heartFill" size={72} />
                    </div>
                }
                kind="Playlist"
                title="Liked Songs"
                color={color}
                meta={
                    <>
                        <span className="strong">You</span>
                        <Dot />
                        <span>{plural(liked.length, 'song')}</span>
                    </>
                }
            />
            <ActionBar color={color}>
                <PlayButton playing={playing} onClick={() => playEntity('liked', 'liked', 'Liked Songs')} />
            </ActionBar>
            <div className="page-body">
                {liked.length ? (
                    <TrackList tracks={liked} context={{ kind: 'liked', id: 'liked', title: 'Liked Songs' }} />
                ) : (
                    <div className="empty-state">
                        <Icon name="heart" size={48} />
                        <h2>Songs you like will appear here</h2>
                        <p>Save songs by tapping the heart icon.</p>
                        <button className="btn-light" onClick={() => navigate({ name: 'search', query: '' })}>
                            Find songs
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

export function MyPlaylistPage({ id }: { id: string }) {
    const p = useLibrary((s) => s.mine.find((x) => x.id === id));
    const playing = usePlayer((s) => s.playing && s.context?.kind === 'my-playlist' && s.context.id === id);
    const cover = p?.tracks[0]?.cover ?? null;
    const color = useHeaderColor(cover);
    const [editing, setEditing] = useState(false);

    useEffect(() => {
        if (p) library.visit({ kind: 'my-playlist', id, title: p.title, subtitle: 'Playlist • You', image: cover });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id, p?.title, cover]);

    if (!p) return <ErrorState what="playlist" />;
    const total = p.tracks.reduce((s, t) => s + t.duration, 0);
    const covers = [...new Set(p.tracks.map((t) => t.cover).filter(Boolean))].slice(0, 4) as string[];

    return (
        <div className="entity-page">
            <PageHeader
                image={cover}
                imageNode={
                    covers.length >= 4 ? (
                        <div className="mosaic">
                            {covers.map((c) => (
                                <Img key={c} id={c} size={320} />
                            ))}
                        </div>
                    ) : covers.length ? undefined : (
                        <div className="img img-fallback-big">
                            <Icon name="note" size={64} />
                        </div>
                    )
                }
                kind="Playlist"
                title={p.title}
                color={color}
                onTitleClick={() => setEditing(true)}
                meta={
                    <>
                        {p.description && <p className="ph-desc">{p.description}</p>}
                        <span className="strong">You</span>
                        {p.tracks.length > 0 && (
                            <>
                                <Dot />
                                <span>
                                    {plural(p.tracks.length, 'song')}, <span className="muted">{longDuration(total)}</span>
                                </span>
                            </>
                        )}
                    </>
                }
            />
            <ActionBar color={color}>
                {p.tracks.length > 0 && <PlayButton playing={playing} onClick={() => playEntity('my-playlist', id, p.title)} />}
                <button className="icon-btn" onClick={() => setEditing(true)} aria-label="Edit details" title="Edit details">
                    <Icon name="settings" size={26} />
                </button>
                <button className="icon-btn" onClick={(e) => openMenu(e, entityMenu('my-playlist', id, p.title))} aria-label="More options">
                    <Icon name="more" size={32} />
                </button>
            </ActionBar>
            <div className="page-body">
                {p.tracks.length > 0 && (
                    <TrackList
                        tracks={p.tracks}
                        context={{ kind: 'my-playlist', id, title: p.title }}
                        extraMenu={(_, i) => [{ label: 'Remove from this playlist', danger: true, onSelect: () => library.removeFromPlaylist(id, i) }]}
                    />
                )}
                <FindMore playlistId={id} existing={p.tracks} />
            </div>
            {editing && <EditDialog id={id} title={p.title} description={p.description} onClose={() => setEditing(false)} />}
        </div>
    );
}

function FindMore({ playlistId, existing }: { playlistId: string; existing: Track[] }) {
    const [q, setQ] = useState('');
    const [debounced, setDebounced] = useState('');
    useEffect(() => {
        const t = setTimeout(() => setDebounced(q.trim()), 350);
        return () => clearTimeout(t);
    }, [q]);
    const results = useAsync((signal) => (debounced ? source.search(debounced, signal) : Promise.resolve(null)), [debounced]);
    const have = new Set(existing.map((t) => t.id));
    return (
        <section className="find-more">
            <h2>Let's find something for your playlist</h2>
            <div className="find-input">
                <Icon name="search" size={18} />
                <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search for songs" aria-label="Search for songs to add" />
                {q && (
                    <button className="icon-btn" onClick={() => setQ('')} aria-label="Clear">
                        <Icon name="close" size={18} />
                    </button>
                )}
            </div>
            {results.data?.tracks.slice(0, 10).map((t) => (
                <div className="find-row" key={t.id}>
                    <Img id={t.cover} size={80} />
                    <div className="q-text">
                        <span className="q-title">{t.title}</span>
                        <ArtistLinks className="q-artist" artists={t.artists} />
                    </div>
                    <span className="find-album muted">{t.album?.title}</span>
                    <button
                        className="btn-outline sm"
                        disabled={have.has(t.id)}
                        onClick={() => {
                            library.addToPlaylist(playlistId, [t]);
                            toast('Added to playlist');
                        }}
                    >
                        {have.has(t.id) ? 'Added' : 'Add'}
                    </button>
                </div>
            ))}
        </section>
    );
}

function EditDialog({ id, title, description, onClose }: { id: string; title: string; description: string; onClose: () => void }) {
    const [t, setT] = useState(title);
    const [d, setD] = useState(description);
    return (
        <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
            <form
                className="modal"
                onSubmit={(e) => {
                    e.preventDefault();
                    library.updatePlaylist(id, { title: t.trim() || title, description: d.trim() });
                    onClose();
                }}
            >
                <header>
                    <h2>Edit details</h2>
                    <button type="button" className="round-btn ghost" onClick={onClose} aria-label="Close">
                        <Icon name="close" size={18} />
                    </button>
                </header>
                <label className="field">
                    <span>Name</span>
                    <input autoFocus value={t} onChange={(e) => setT(e.target.value)} maxLength={100} />
                </label>
                <label className="field">
                    <span>Description</span>
                    <textarea value={d} onChange={(e) => setD(e.target.value)} rows={4} maxLength={300} placeholder="Add an optional description" />
                </label>
                <footer>
                    <button className="btn-light" type="submit">
                        Save
                    </button>
                </footer>
            </form>
        </div>
    );
}

