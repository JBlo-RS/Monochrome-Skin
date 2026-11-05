import type { Album, AlbumRef, Artist, ArtistRef, Playlist, Track } from './types';

/* eslint-disable @typescript-eslint/no-explicit-any */
type Any = any;

const str = (v: unknown): string => (v === null || v === undefined ? '' : String(v));

export function toArtistRef(a: Any): ArtistRef | null {
    if (!a) return null;
    if (typeof a === 'string') return { id: '', name: a };
    const name = a.name ?? a.title;
    if (!name) return null;
    return { id: str(a.id ?? a.artistId), name: str(name) };
}

export function artistsOf(o: Any): ArtistRef[] {
    const list: Any[] = Array.isArray(o?.artists) && o.artists.length ? o.artists : o?.artist ? [o.artist] : [];
    const seen = new Set<string>();
    const out: ArtistRef[] = [];
    for (const a of list) {
        const ref = toArtistRef(a);
        if (!ref) continue;
        const key = ref.id || ref.name;
        if (seen.has(key)) continue;
        seen.add(key);
        out.push(ref);
    }
    return out;
}

function albumRefOf(t: Any): AlbumRef | null {
    const a = t?.album;
    if (!a || typeof a !== 'object') return null;
    return {
        id: str(a.id),
        title: str(a.title ?? a.name),
        cover: a.cover ?? a.image ?? a.squareImage ?? null,
    };
}

export function toTrack(t: Any): Track | null {
    if (!t || (t.type && String(t.type).toLowerCase().includes('video'))) return null;
    const album = albumRefOf(t);
    return {
        id: str(t.id),
        title: str(t.title ?? t.name ?? 'Unknown'),
        version: t.version || null,
        duration: Number(t.duration) || 0,
        explicit: !!t.explicit,
        quality: t.audioQuality ?? null,
        artists: artistsOf(t),
        album,
        cover: album?.cover ?? t.cover ?? t.image ?? null,
        raw: t,
    };
}

export function toTracks(list: Any): Track[] {
    const arr: Any[] = Array.isArray(list) ? list : Array.isArray(list?.items) ? list.items : [];
    return arr
        .map((x) => toTrack(x?.item ?? x?.track ?? x))
        .filter((t): t is Track => !!t && !!t.id && !(t.raw as Any)?.isUnavailable);
}

export function toAlbum(a: Any): Album | null {
    if (!a) return null;
    return {
        id: str(a.id),
        title: str(a.title ?? a.name ?? 'Unknown'),
        cover: a.cover ?? a.image ?? a.squareImage ?? null,
        artists: artistsOf(a),
        releaseDate: a.releaseDate ?? null,
        type: a.type ?? null,
        numberOfTracks: a.numberOfTracks ?? null,
        duration: a.duration ?? null,
        copyright: a.copyright ?? null,
        raw: a,
    };
}

export function toArtist(a: Any): Artist | null {
    if (!a) return null;
    const ref = toArtistRef(a);
    if (!ref) return null;
    return { ...ref, picture: a.picture ?? a.avatar ?? a.image ?? a.selectedAlbumCoverFallback ?? null, raw: a };
}

export function toPlaylist(p: Any): Playlist | null {
    if (!p) return null;
    const owner = p.creator?.name || (p.type === 'EDITORIAL' || p.type === 'ARTIST' ? 'Editorial' : null);
    return {
        id: str(p.uuid ?? p.id),
        title: str(p.title ?? p.name ?? 'Playlist'),
        description: p.description ?? null,
        cover: p.squareImage ?? p.image ?? p.cover ?? null,
        owner,
        numberOfTracks: p.numberOfTracks ?? null,
        raw: p,
    };
}

export function items<T>(list: Any, fn: (x: Any) => T | null): T[] {
    const arr: Any[] = Array.isArray(list) ? list : Array.isArray(list?.items) ? list.items : [];
    return arr.map(fn).filter((x): x is T => !!x);
}
