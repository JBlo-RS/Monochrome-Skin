import { Icon } from './Icon';

export function PlayButton({
    playing,
    onClick,
    size = 56,
    className = '',
    label,
}: {
    playing: boolean;
    onClick: (e: React.MouseEvent) => void;
    size?: number;
    className?: string;
    label?: string;
}) {
    return (
        <button
            className={`play-btn ${className}`}
            style={{ width: size, height: size }}
            onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                onClick(e);
            }}
            aria-label={label ?? (playing ? 'Pause' : 'Play')}
            title={label ?? (playing ? 'Pause' : 'Play')}
        >
            <Icon name={playing ? 'pause' : 'play'} size={Math.round(size * 0.43)} />
        </button>
    );
}
