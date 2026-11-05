import { useEffect, useState } from 'react';

const cache = new Map<string, string>();
const FALLBACK = '#535353';

/** Picks a vivid, mid-dark colour from an image for page headers (falls back to grey if CORS blocks it). */
export function useDominantColor(url: string | null | undefined) {
    const [color, setColor] = useState(() => (url && cache.get(url)) || FALLBACK);
    useEffect(() => {
        if (!url) return setColor(FALLBACK);
        const hit = cache.get(url);
        if (hit) return setColor(hit);
        let alive = true;
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
            try {
                const c = document.createElement('canvas');
                c.width = c.height = 24;
                const ctx = c.getContext('2d', { willReadFrequently: true })!;
                ctx.drawImage(img, 0, 0, 24, 24);
                const d = ctx.getImageData(0, 0, 24, 24).data;
                let best = { score: -1, r: 83, g: 83, b: 83 };
                const buckets = new Map<string, { n: number; r: number; g: number; b: number }>();
                for (let i = 0; i < d.length; i += 4) {
                    const r = d[i], g = d[i + 1], b = d[i + 2];
                    const k = `${r >> 5}-${g >> 5}-${b >> 5}`;
                    const e = buckets.get(k) ?? { n: 0, r: 0, g: 0, b: 0 };
                    e.n++; e.r += r; e.g += g; e.b += b;
                    buckets.set(k, e);
                }
                for (const e of buckets.values()) {
                    const r = e.r / e.n, g = e.g / e.n, b = e.b / e.n;
                    const max = Math.max(r, g, b), min = Math.min(r, g, b);
                    const sat = max ? (max - min) / max : 0;
                    const score = e.n * (0.3 + sat) * (max > 30 && max < 245 ? 1 : 0.2);
                    if (score > best.score) best = { score, r, g, b };
                }
                // Darken so white text stays readable on top.
                const max = Math.max(best.r, best.g, best.b) || 1;
                const k = Math.min(1, 170 / max);
                const hex = `rgb(${Math.round(best.r * k)}, ${Math.round(best.g * k)}, ${Math.round(best.b * k)})`;
                cache.set(url, hex);
                if (alive) setColor(hex);
            } catch {
                if (alive) setColor(FALLBACK);
            }
        };
        img.onerror = () => alive && setColor(FALLBACK);
        img.src = url;
        return () => {
            alive = false;
        };
    }, [url]);
    return color;
}
