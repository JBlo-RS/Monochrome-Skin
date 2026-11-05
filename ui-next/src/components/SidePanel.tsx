import { player, usePlayer } from '../state/player';
import { Icon } from './Icon';
import { Img } from './Img';
import { ArtistLinks } from './Links';
import { LikeButton, type Panel } from './PlayerBar';
import { useAsync } from '../lib/useAsync';
import { source } from '../lib/source';
import { href } from '../lib/router';
import { openMenu } from '../state/menu';
import { trackMenu } from '../lib/actions';
import type { Track } from '../lib/types';

export function SidePanel({ panel, onClose }: { panel: Exclude<Panel, null>; onClose: () => void }) {
    return (
        <aside className="side-panel panel" aria-label={panel === 'now' ? 'Now playing' : 'Queue'}>
            {panel === 'now' ? <NowPlaying onClose={onClose} /> : <QueueView onClose={onClose} />}
        </aside>
    );
}

function NowPlaying({ onClose }: { onClose: () => void }) {
    const current = usePlayer((s) => s.current);
    const ctx = usePlayer((s) => s.context);
    const nextUp = usePlayer((s) => s.upNext[0] ?? s.queue[s.index + 1] ?? null);
    const artistId = current?.artists.find((a) => a.id)?.id;
    const artist = useAsync(() => (artistId ? source.getArtist(artistId) : Promise.resolve(null)), [artistId]);

    if (!current)
        return (
            <>
                <PanelHead title="Now playing" onClose={onClose} />
                <p className="muted pad">Nothing playing yet. Pick a song to get started.</p>
            </>
        );

    return (
        <>
            <PanelHead title={ctx?.title ?? 'Now playing'} onClose={onClose} />
            <div className="np-scroll">
                <Img id={current.cover} size={640} className="np-art" />
                <div className="np-title-row">
                    <div className="np-meta">
                        {current.album?.id ? (
                            <a className="np-title" href={href({ name: 'album', id: current.album.id })}>
                                {current.title}
                            </a>
                        ) : (
                            <span className="np-title">{current.title}</span>
                        )}
                        <ArtistLinks className="np-artist" artists={current.artists} />
                    </div>
                    <LikeButton size={22} />
                    <button className="icon-btn" onClick={(e) => openMenu(e, trackMenu(current))} aria-label="More options">
                        <Icon name="more" size={20} />
                    </button>
                </div>

                {artist.data && (
                    <a className="np-card about" href={href({ name: 'artist', id: artist.data.artist.id })}>
                        <div className="about-img">
                            <Img id={artist.data.artist.picture} size={640} />
                            <span className="about-label">About the artist</span>
                        </div>
                        <div className="about-body">
                            <strong>{artist.data.artist.name}</strong>
                            {artist.data.bio && <p>{stripTags(artist.data.bio)}</p>}
                        </div>
                    </a>
                )}

                {nextUp && (
                    <div className="np-card">
                        <div className="np-card-head">
                            <strong>Next in queue</strong>
                        </div>
                        <QueueRow track={nextUp} onPlay={() => player.next()} />
                    </div>
                )}
            </div>
        </>
    );
}

function stripTags(s: string) {
    return s.replace(/\[[^\]]*]/g, '').replace(/<[^>]+>/g, '').slice(0, 320);
}

function QueueView({ onClose }: { onClose: () => void }) {
    const current = usePlayer((s) => s.current);
    const upNext = usePlayer((s) => s.upNext);
    const queue = usePlayer((s) => s.queue);
    const index = usePlayer((s) => s.index);
    const ctx = usePlayer((s) => s.context);
    const autoplay = usePlayer((s) => s.autoplay);
    const rest = queue.slice(index + 1, index + 51);

    return (
        <>
            <PanelHead title="Queue" onClose={onClose} />
            <div className="np-scroll queue">
                <h4>Now playing</h4>
                {current ? <QueueRow track={current} active /> : <p className="muted">Nothing playing</p>}
                {upNext.length > 0 && (
                    <>
                        <div className="q-head">
                            <h4>Next in queue</h4>
                            <button className="link-btn" onClick={player.clearUpNext}>
                                Clear queue
                            </button>
                        </div>
                        {upNext.map((t, i) => (
                            <QueueRow key={t.id + i} track={t} onPlay={() => player.jumpToUpNext(i)} onRemove={() => player.removeUpNext(i)} />
                        ))}
                    </>
                )}
                {rest.length > 0 && (
                    <>
                        <h4>Next from: {ctx?.title ?? 'your list'}</h4>
                        {rest.map((t, i) => (
                            <QueueRow key={t.id + i} track={t} onPlay={() => player.jumpTo(index + 1 + i)} />
                        ))}
                    </>
                )}
                <label className="autoplay">
                    <span>
                        <strong>Autoplay</strong>
                        <small>Keep listening to similar songs when your music ends</small>
                    </span>
                    <input type="checkbox" className="switch" checked={autoplay} onChange={player.toggleAutoplay} />
                </label>
            </div>
        </>
    );
}

function QueueRow({ track, active, onPlay, onRemove }: { track: Track; active?: boolean; onPlay?: () => void; onRemove?: () => void }) {
    return (
        <div className={`q-row ${active ? 'active' : ''}`} onDoubleClick={onPlay} onContextMenu={(e) => openMenu(e, trackMenu(track))}>
            <button className="q-art" onClick={onPlay} aria-label={`Play ${track.title}`} disabled={!onPlay}>
                <Img id={track.cover} size={80} />
                {onPlay && (
                    <span className="q-play">
                        <Icon name="play" size={16} />
                    </span>
                )}
            </button>
            <div className="q-text">
                <span className="q-title">{track.title}</span>
                <ArtistLinks className="q-artist" artists={track.artists} />
            </div>
            {onRemove && (
                <button className="icon-btn q-remove" onClick={onRemove} aria-label="Remove from queue" title="Remove from queue">
                    <Icon name="close" size={16} />
                </button>
            )}
        </div>
    );
}

function PanelHead({ title, onClose }: { title: string; onClose: () => void }) {
    return (
        <header className="panel-head">
            <strong title={title}>{title}</strong>
            <button className="round-btn ghost" onClick={onClose} aria-label="Close panel">
                <Icon name="close" size={18} />
            </button>
        </header>
    );
}
