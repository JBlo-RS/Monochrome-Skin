import { Fragment } from 'react';
import type { ArtistRef } from '../lib/types';
import { href } from '../lib/router';

export function ArtistLinks({ artists, className = '' }: { artists: ArtistRef[]; className?: string }) {
    if (!artists.length) return <span className={className}>Unknown artist</span>;
    return (
        <span className={`artist-links ${className}`}>
            {artists.map((a, i) => (
                <Fragment key={(a.id || a.name) + i}>
                    {i > 0 && ', '}
                    {a.id ? (
                        <a href={href({ name: 'artist', id: a.id })} onClick={(e) => e.stopPropagation()}>
                            {a.name}
                        </a>
                    ) : (
                        a.name
                    )}
                </Fragment>
            ))}
        </span>
    );
}

export function Explicit() {
    return (
        <span className="explicit" title="Explicit" aria-label="Explicit">
            E
        </span>
    );
}
