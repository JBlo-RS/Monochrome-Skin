import { Img } from './Img';
import { useDominantColor } from '../lib/color';
import { source } from '../lib/source';
import type { IconName } from './Icon';

export function useHeaderColor(image: string | null | undefined) {
    return useDominantColor(source.image(image, 160));
}

export function PageHeader({
    image,
    kind,
    title,
    meta,
    round = false,
    color,
    fallback = 'note',
    imageNode,
    onTitleClick,
}: {
    image: string | null | undefined;
    kind: string;
    title: string;
    meta: React.ReactNode;
    round?: boolean;
    color: string;
    fallback?: IconName;
    imageNode?: React.ReactNode;
    onTitleClick?: () => void;
}) {
    const size = title.length > 40 ? 'sm' : title.length > 18 ? 'md' : 'lg';
    return (
        <header className="page-header" style={{ '--hdr': color } as React.CSSProperties}>
            <div className="ph-art">{imageNode ?? <Img id={image} size={640} round={round} fallback={fallback} />}</div>
            <div className="ph-text">
                <span className="ph-kind">{kind}</span>
                <h1 className={`ph-title ${size}`} onClick={onTitleClick} style={onTitleClick ? { cursor: 'pointer' } : undefined}>
                    {title}
                </h1>
                <div className="ph-meta">{meta}</div>
            </div>
        </header>
    );
}

export function ActionBar({ children, color }: { children: React.ReactNode; color: string }) {
    return (
        <div className="action-bar" style={{ '--hdr': color } as React.CSSProperties}>
            {children}
        </div>
    );
}

export function Dot() {
    return <span className="dot">•</span>;
}
