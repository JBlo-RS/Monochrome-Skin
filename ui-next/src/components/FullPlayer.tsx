import { useEffect } from 'react';
import { player, usePlayer } from '../state/player';
import { Icon } from './Icon';
import { Img } from './Img';
import { ArtistLinks } from './Links';
import { Controls, LikeButton, Progress } from './PlayerBar';
import { source } from '../lib/source';
import { useDominantColor } from '../lib/color';
import { openMenu } from '../state/menu';
import { trackMenu } from '../lib/actions';
import { duration } from '../lib/format';

/** Full-screen player (desktop "expand", and the main player view on phones). */
export function FullPlayer({ onClose, onQueue }: { onClose: () => void; onQueue: () => void }) {
    const current = usePlayer((s) => s.current);
    const ctx = usePlayer((s) => s.context);
    const time = usePlayer((s) => s.time);
    const dur = usePlayer((s) => s.duration || s.current?.duration || 0);
    const color = useDominantColor(source.image(current?.cover, 160));

    useEffect(() => {
        const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
        addEventListener('keydown', onKey);
        return () => removeEventListener('keydown', onKey);
    }, [onClose]);

    if (!current) return null;
    return (
        <div className="full-player" style={{ '--hdr': color } as React.CSSProperties} role="dialog" aria-label="Now playing">
            <div className="fp-bg">
                <Img id={current.cover} size={160} />
            </div>
            <header className="fp-head">
                <button className="round-btn ghost" onClick={onClose} aria-label="Close full-screen player">
                    <Icon name="chevronDown" />
                </button>
                <div className="fp-ctx">
                    <small>Playing from</small>
                    <strong>{ctx?.title ?? 'Your queue'}</strong>
                </div>
                <button className="round-btn ghost" onClick={(e) => openMenu(e, trackMenu(current))} aria-label="More options">
                    <Icon name="more" />
                </button>
            </header>
            <div className="fp-body">
                <Img id={current.cover} size={1280} className="fp-art" />
                <div className="fp-info">
                    <div className="fp-title-row">
                        <div className="fp-meta">
                            <h2>{current.title}</h2>
                            <ArtistLinks artists={current.artists} />
                        </div>
                        <LikeButton size={26} />
                    </div>
                    <Progress compact />
                    <div className="fp-times">
                        <span>{duration(time)}</span>
                        <span>{duration(dur)}</span>
                    </div>
                    <Controls big />
                    <div className="fp-foot">
                        <span />
                        <button className="icon-btn" onClick={onQueue} aria-label="Queue">
                            <Icon name="queue" size={20} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export function MiniPlayer({ onExpand }: { onExpand: () => void }) {
    const current = usePlayer((s) => s.current);
    const playing = usePlayer((s) => s.playing);
    const time = usePlayer((s) => s.time);
    const dur = usePlayer((s) => s.duration || s.current?.duration || 0);
    const color = useDominantColor(source.image(current?.cover, 160));
    if (!current) return null;
    return (
        <div className="mini-player" style={{ '--hdr': color } as React.CSSProperties} onClick={onExpand}>
            <Img id={current.cover} size={160} />
            <div className="mp-text">
                <span className="mp-title">{current.title}</span>
                <span className="mp-artist">{current.artists.map((a) => a.name).join(', ')}</span>
            </div>
            <span onClick={(e) => e.stopPropagation()}>
                <LikeButton size={22} />
            </span>
            <button
                className="icon-btn mp-play"
                onClick={(e) => {
                    e.stopPropagation();
                    player.toggle();
                }}
                aria-label={playing ? 'Pause' : 'Play'}
            >
                <Icon name={playing ? 'pause' : 'play'} size={24} />
            </button>
            <div className="mp-progress" style={{ width: `${dur ? (time / dur) * 100 : 0}%` }} />
        </div>
    );
}
