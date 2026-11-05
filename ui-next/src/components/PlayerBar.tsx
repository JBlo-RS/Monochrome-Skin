import { player, usePlayer } from '../state/player';
import { useLibrary } from '../state/library';
import { Icon } from './Icon';
import { Img } from './Img';
import { ArtistLinks } from './Links';
import { Slider } from './Slider';
import { duration } from '../lib/format';
import { href } from '../lib/router';
import { toggleLike, trackMenu } from '../lib/actions';
import { openMenu } from '../state/menu';

export type Panel = 'now' | 'queue' | null;

export function Progress({ compact = false }: { compact?: boolean }) {
    const time = usePlayer((s) => s.time);
    const dur = usePlayer((s) => s.duration || s.current?.duration || 0);
    return (
        <div className={`progress ${compact ? 'compact' : ''}`}>
            {!compact && <span className="time">{duration(time)}</span>}
            <Slider value={time} max={dur} label="Seek" step={5} valueText={`${duration(time)} of ${duration(dur)}`} onCommit={(v) => player.seek(v)} />
            {!compact && <span className="time">{duration(dur)}</span>}
        </div>
    );
}

export function Controls({ big = false }: { big?: boolean }) {
    const playing = usePlayer((s) => s.playing);
    const loading = usePlayer((s) => s.loading);
    const shuffle = usePlayer((s) => s.shuffle);
    const repeat = usePlayer((s) => s.repeat);
    const has = usePlayer((s) => !!s.current);
    return (
        <div className={`controls ${big ? 'big' : ''}`}>
            <button className={`icon-btn toggle ${shuffle ? 'on' : ''}`} onClick={player.toggleShuffle} aria-pressed={shuffle} aria-label="Shuffle" title={shuffle ? 'Disable shuffle' : 'Enable shuffle'}>
                <Icon name="shuffle" size={big ? 26 : 16} />
            </button>
            <button className="icon-btn" onClick={player.prev} aria-label="Previous" title="Previous" disabled={!has}>
                <Icon name="prev" size={big ? 32 : 16} />
            </button>
            <button className={`main-play ${loading ? 'loading' : ''}`} onClick={player.toggle} aria-label={playing ? 'Pause' : 'Play'} title={playing ? 'Pause' : 'Play'} disabled={!has}>
                <Icon name={playing ? 'pause' : 'play'} size={big ? 28 : 16} />
            </button>
            <button className="icon-btn" onClick={player.next} aria-label="Next" title="Next" disabled={!has}>
                <Icon name="next" size={big ? 32 : 16} />
            </button>
            <button
                className={`icon-btn toggle ${repeat !== 'off' ? 'on' : ''}`}
                onClick={player.cycleRepeat}
                aria-label={`Repeat: ${repeat}`}
                title={repeat === 'off' ? 'Enable repeat' : repeat === 'all' ? 'Enable repeat one' : 'Disable repeat'}
            >
                <Icon name="repeat" size={big ? 26 : 16} />
                {repeat === 'one' && <span className="one">1</span>}
            </button>
        </div>
    );
}

export function LikeButton({ size = 16 }: { size?: number }) {
    const current = usePlayer((s) => s.current);
    const liked = useLibrary((s) => !!current && s.liked.some((t) => t.id === current.id));
    if (!current) return null;
    return (
        <button
            className={`icon-btn like ${liked ? 'on' : ''}`}
            onClick={() => toggleLike(current)}
            aria-pressed={liked}
            aria-label={liked ? 'Remove from Liked Songs' : 'Save to Liked Songs'}
            title={liked ? 'Remove from Liked Songs' : 'Save to Liked Songs'}
        >
            <Icon name={liked ? 'heartFill' : 'heart'} size={size} />
        </button>
    );
}

export function PlayerBar({ panel, setPanel, onExpand }: { panel: Panel; setPanel: (p: Panel) => void; onExpand: () => void }) {
    const current = usePlayer((s) => s.current);
    const volume = usePlayer((s) => s.volume);
    const muted = usePlayer((s) => s.muted);
    const quality = usePlayer((s) => s.quality);
    const v = muted ? 0 : volume;

    return (
        <footer className="player-bar" aria-label="Player">
            <div className="pb-left">
                {current && (
                    <>
                        <button className="pb-art" onClick={onExpand} aria-label="Open full-screen player">
                            <Img id={current.cover} size={160} />
                            <span className="pb-art-expand">
                                <Icon name="chevronDown" size={16} style={{ transform: 'rotate(180deg)' }} />
                            </span>
                        </button>
                        <div className="pb-meta" onContextMenu={(e) => openMenu(e, trackMenu(current))}>
                            {current.album?.id ? (
                                <a className="pb-title" href={href({ name: 'album', id: current.album.id })}>
                                    {current.title}
                                </a>
                            ) : (
                                <span className="pb-title">{current.title}</span>
                            )}
                            <ArtistLinks className="pb-artist" artists={current.artists} />
                        </div>
                        <LikeButton />
                    </>
                )}
            </div>
            <div className="pb-center">
                <Controls />
                <Progress />
            </div>
            <div className="pb-right">
                {quality && <span className="quality">{quality}</span>}
                <button className={`icon-btn toggle ${panel === 'now' ? 'on' : ''}`} onClick={() => setPanel(panel === 'now' ? null : 'now')} aria-pressed={panel === 'now'} aria-label="Now playing view" title="Now playing view">
                    <Icon name="nowPlaying" size={16} />
                </button>
                <button className={`icon-btn toggle ${panel === 'queue' ? 'on' : ''}`} onClick={() => setPanel(panel === 'queue' ? null : 'queue')} aria-pressed={panel === 'queue'} aria-label="Queue" title="Queue">
                    <Icon name="queue" size={16} />
                </button>
                <button className="icon-btn" onClick={player.toggleMute} aria-label={muted ? 'Unmute' : 'Mute'} title={muted ? 'Unmute' : 'Mute'}>
                    <Icon name={v === 0 ? 'volumeMute' : v < 0.5 ? 'volumeLow' : 'volume'} size={16} />
                </button>
                <Slider className="volume" value={v} max={1} step={0.05} label="Volume" valueText={`${Math.round(v * 100)}%`} onChange={player.setVolume} onCommit={player.setVolume} />
                <button className="icon-btn" onClick={onExpand} aria-label="Full screen" title="Full screen">
                    <Icon name="expand" size={16} />
                </button>
            </div>
        </footer>
    );
}
