import { memo } from 'react';
import type { Track } from '../lib/types';
import { duration } from '../lib/format';
import { href } from '../lib/router';
import { Img } from './Img';
import { Icon } from './Icon';
import { ArtistLinks, Explicit } from './Links';
import { player, usePlayer, type PlayContext } from '../state/player';
import { useLibrary } from '../state/library';
import { openMenu, type MenuItem } from '../state/menu';
import { toggleLike, trackMenu } from '../lib/actions';

interface Props {
    tracks: Track[];
    context: PlayContext;
    showCover?: boolean;
    showAlbum?: boolean;
    showArtists?: boolean;
    showHeader?: boolean;
    numbered?: boolean;
    extraMenu?: (track: Track, index: number) => MenuItem[];
    playsCount?: boolean;
}

export function TrackList({ tracks, context, showCover = true, showAlbum = true, showArtists = true, showHeader = true, numbered = true, extraMenu }: Props) {
    const currentId = usePlayer((s) => s.current?.id);
    const playing = usePlayer((s) => s.playing);
    const sameContext = usePlayer((s) => s.context?.kind === context.kind && s.context.id === context.id);
    const liked = useLibrary((s) => s.liked);
    const likedIds = new Set(liked.map((t) => t.id));

    const play = (i: number) => {
        const t = tracks[i];
        if (t.id === currentId && sameContext) player.toggle();
        else player.playList(tracks, i, context);
    };

    return (
        <div className={`tracklist ${showAlbum ? 'with-album' : ''}`} role="grid" aria-rowcount={tracks.length}>
            {showHeader && (
                <div className="tl-row tl-head" role="row">
                    <span className="tl-num">#</span>
                    <span>Title</span>
                    {showAlbum && <span className="tl-album">Album</span>}
                    <span className="tl-like" />
                    <span className="tl-dur" title="Duration">
                        <Icon name="clock" size={16} />
                    </span>
                    <span className="tl-more" />
                </div>
            )}
            {tracks.map((t, i) => (
                <Row
                    key={t.id + ':' + i}
                    track={t}
                    index={i}
                    active={t.id === currentId}
                    playing={t.id === currentId && playing}
                    liked={likedIds.has(t.id)}
                    showCover={showCover}
                    showAlbum={showAlbum}
                    showArtists={showArtists}
                    numbered={numbered}
                    onPlay={play}
                    extraMenu={extraMenu}
                />
            ))}
        </div>
    );
}

const Row = memo(function Row({
    track: t,
    index,
    active,
    playing,
    liked,
    showCover,
    showAlbum,
    showArtists,
    numbered,
    onPlay,
    extraMenu,
}: {
    track: Track;
    index: number;
    active: boolean;
    playing: boolean;
    liked: boolean;
    showCover: boolean;
    showAlbum: boolean;
    showArtists: boolean;
    numbered: boolean;
    onPlay: (i: number) => void;
    extraMenu?: (track: Track, index: number) => MenuItem[];
}) {
    const menu = (e: React.MouseEvent) => openMenu(e, trackMenu(t, extraMenu?.(t, index)));
    const coarse = typeof matchMedia !== 'undefined' && matchMedia('(pointer: coarse)').matches;
    return (
        <div
            className={`tl-row ${active ? 'active' : ''}`}
            role="row"
            tabIndex={0}
            onDoubleClick={() => !coarse && onPlay(index)}
            onClick={() => coarse && onPlay(index)}
            onKeyDown={(e) => e.key === 'Enter' && onPlay(index)}
            onContextMenu={menu}
        >
            <span className="tl-num">
                {playing ? (
                    <span className="eq" aria-label="Playing">
                        <i />
                        <i />
                        <i />
                    </span>
                ) : (
                    <span className="n">{numbered ? index + 1 : <Icon name="note" size={16} />}</span>
                )}
                <button
                    className="tl-play"
                    aria-label={playing ? 'Pause' : `Play ${t.title}`}
                    onClick={(e) => {
                        e.stopPropagation();
                        onPlay(index);
                    }}
                >
                    <Icon name={playing ? 'pause' : 'play'} size={16} />
                </button>
            </span>
            <span className="tl-title">
                {showCover && <Img id={t.cover} size={80} className="tl-cover" />}
                <span className="tl-text">
                    <span className="tl-name">
                        {t.title}
                        {t.version ? <span className="tl-version"> ({t.version})</span> : null}
                    </span>
                    {showArtists && (
                        <span className="tl-sub">
                            {t.explicit && <Explicit />}
                            <ArtistLinks artists={t.artists} />
                        </span>
                    )}
                    {!showArtists && t.explicit && (
                        <span className="tl-sub">
                            <Explicit />
                        </span>
                    )}
                </span>
            </span>
            {showAlbum && (
                <span className="tl-album">
                    {t.album?.id ? (
                        <a href={href({ name: 'album', id: t.album.id })} onClick={(e) => e.stopPropagation()}>
                            {t.album.title}
                        </a>
                    ) : (
                        t.album?.title
                    )}
                </span>
            )}
            <span className="tl-like">
                <button
                    className={`icon-btn like ${liked ? 'on' : ''}`}
                    aria-label={liked ? 'Remove from Liked Songs' : 'Save to Liked Songs'}
                    aria-pressed={liked}
                    onClick={(e) => {
                        e.stopPropagation();
                        toggleLike(t);
                    }}
                >
                    <Icon name={liked ? 'heartFill' : 'heart'} size={16} />
                </button>
            </span>
            <span className="tl-dur">{t.duration ? duration(t.duration) : ''}</span>
            <span className="tl-more">
                <button className="icon-btn" aria-label={`More options for ${t.title}`} onClick={menu}>
                    <Icon name="more" size={16} />
                </button>
            </span>
        </div>
    );
});
