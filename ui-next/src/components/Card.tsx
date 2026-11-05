import { Img } from './Img';
import { PlayButton } from './PlayButton';
import { usePlayer } from '../state/player';
import { entityMenu, playEntity, type EntityKind } from '../lib/actions';
import { openMenu } from '../state/menu';
import { navigate, type Route } from '../lib/router';
import type { Album, Artist, Playlist } from '../lib/types';

export function Card({
    kind,
    id,
    title,
    subtitle,
    image,
    route,
    entity,
}: {
    kind: EntityKind;
    id: string;
    title: string;
    subtitle: React.ReactNode;
    image: string | null;
    route: Route;
    entity?: Album | Artist | Playlist;
}) {
    const playing = usePlayer((s) => s.playing && s.context?.kind === kind && s.context.id === id);
    const round = kind === 'artist';
    return (
        <div
            className={`card ${round ? 'artist' : ''}`}
            role="link"
            tabIndex={0}
            onClick={() => navigate(route)}
            onKeyDown={(e) => e.key === 'Enter' && navigate(route)}
            onContextMenu={(e) => openMenu(e, entityMenu(kind, id, title, entity))}
        >
            <div className="card-art">
                <Img id={image} size={320} round={round} alt="" fallback={round ? 'user' : kind === 'album' ? 'album' : 'note'} />
                <PlayButton className={`card-play ${playing ? 'on' : ''}`} size={48} playing={playing} onClick={() => playEntity(kind, id, title)} />
            </div>
            <div className="card-title" title={title}>
                {title}
            </div>
            <div className="card-sub">{subtitle}</div>
        </div>
    );
}

export function Shelf({ title, children, more, wrap = false }: { title: string; children: React.ReactNode; more?: () => void; wrap?: boolean }) {
    return (
        <section className="shelf">
            <header>
                <h2>{more ? <button onClick={more}>{title}</button> : title}</h2>
                {more && (
                    <button className="show-all" onClick={more}>
                        Show all
                    </button>
                )}
            </header>
            <div className={wrap ? 'card-grid' : 'card-row'}>{children}</div>
        </section>
    );
}

export function SkeletonShelf({ title = '' }: { title?: string }) {
    return (
        <section className="shelf">
            <header>
                <h2>{title || <span className="sk sk-text" style={{ width: 180 }} />}</h2>
            </header>
            <div className="card-row">
                {Array.from({ length: 6 }, (_, i) => (
                    <div className="card sk-card" key={i}>
                        <div className="sk sk-art" />
                        <span className="sk sk-text" />
                        <span className="sk sk-text short" />
                    </div>
                ))}
            </div>
        </section>
    );
}
