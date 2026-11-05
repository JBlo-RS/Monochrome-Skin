export function duration(sec: number) {
    if (!Number.isFinite(sec) || sec < 0) sec = 0;
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    if (m >= 60) return `${Math.floor(m / 60)}:${String(m % 60).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    return `${m}:${String(s).padStart(2, '0')}`;
}

export function longDuration(sec: number) {
    const h = Math.floor(sec / 3600);
    const m = Math.round((sec % 3600) / 60);
    return h ? `${h} hr ${m} min` : `${m} min`;
}

export function year(date?: string | null) {
    return date ? String(date).slice(0, 4) : '';
}

export function greeting() {
    const h = new Date().getHours();
    return h < 5 ? 'Good night' : h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
}

export function albumType(type?: string | null) {
    const t = String(type || 'ALBUM').toUpperCase();
    return t === 'EP' ? 'EP' : t === 'SINGLE' ? 'Single' : t === 'COMPILATION' ? 'Compilation' : 'Album';
}

export const plural = (n: number, word: string) => `${n.toLocaleString()} ${word}${n === 1 ? '' : 's'}`;
