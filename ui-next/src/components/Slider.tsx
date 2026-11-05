import { useRef, useState } from 'react';

/** Pointer + keyboard slider styled like a thin progress bar that grows on hover. */
export function Slider({
    value,
    max,
    onChange,
    onCommit,
    label,
    step,
    valueText,
    className = '',
}: {
    value: number;
    max: number;
    onChange?: (v: number) => void;
    onCommit?: (v: number) => void;
    label: string;
    step?: number;
    valueText?: string;
    className?: string;
}) {
    const ref = useRef<HTMLDivElement>(null);
    const [drag, setDrag] = useState<number | null>(null);
    const shown = drag ?? value;
    const pct = max > 0 ? Math.max(0, Math.min(100, (shown / max) * 100)) : 0;

    const at = (clientX: number) => {
        const r = ref.current!.getBoundingClientRect();
        return Math.max(0, Math.min(1, (clientX - r.left) / r.width)) * max;
    };

    return (
        <div
            ref={ref}
            className={`slider ${drag !== null ? 'dragging' : ''} ${className}`}
            role="slider"
            tabIndex={0}
            aria-label={label}
            aria-valuemin={0}
            aria-valuemax={Math.round(max)}
            aria-valuenow={Math.round(shown)}
            aria-valuetext={valueText}
            onPointerDown={(e) => {
                if (!max) return;
                e.currentTarget.setPointerCapture(e.pointerId);
                const v = at(e.clientX);
                setDrag(v);
                onChange?.(v);
            }}
            onPointerMove={(e) => {
                if (drag === null) return;
                const v = at(e.clientX);
                setDrag(v);
                onChange?.(v);
            }}
            onPointerUp={(e) => {
                if (drag === null) return;
                const v = at(e.clientX);
                setDrag(null);
                onCommit?.(v);
            }}
            onPointerCancel={() => setDrag(null)}
            onKeyDown={(e) => {
                const s = step ?? max / 20;
                let v: number | null = null;
                if (e.key === 'ArrowRight' || e.key === 'ArrowUp') v = Math.min(max, value + s);
                if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') v = Math.max(0, value - s);
                if (v === null) return;
                e.preventDefault();
                e.stopPropagation();
                onChange?.(v);
                onCommit?.(v);
            }}
        >
            <div className="slider-track">
                <div className="slider-fill" style={{ width: `${pct}%` }} />
            </div>
            <div className="slider-thumb" style={{ left: `${pct}%` }} />
        </div>
    );
}
