import { useState } from 'react';
import { source } from '../lib/source';
import { Icon, type IconName } from './Icon';

export function Img({
    id,
    size = 320,
    alt = '',
    round = false,
    className = '',
    fallback = 'note',
}: {
    id: string | null | undefined;
    size?: number;
    alt?: string;
    round?: boolean;
    className?: string;
    fallback?: IconName;
}) {
    const url = source.image(id, size);
    const [failed, setFailed] = useState<string | null>(null);
    const broken = !url || failed === url;
    return (
        <div className={`img ${round ? 'round' : ''} ${className}`}>
            {broken ? (
                <div className="img-fallback">
                    <Icon name={fallback} size={Math.max(18, Math.min(64, size / 6))} />
                </div>
            ) : (
                <img src={url} alt={alt} loading="lazy" decoding="async" draggable={false} onError={() => setFailed(url)} />
            )}
        </div>
    );
}
