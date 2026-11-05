import { useSyncExternalStore } from 'react';
import type { Album, Artist, Playlist, Track } from '../lib/types';

export interface MyPlaylist {
    id: string;
    title: string;
    description: string;
    tracks: Track[];
    createdAt: number;
}

export type RecentKind = 'album' | 'artist' | 'playlist' | 'my-playlist' | 'liked';
export interface RecentItem {
    kind: RecentKind;
    id: string;
    title: string;
    subtitle: string;
    image: string | null;
    at: number;
}

interface LibraryState {
    liked: Track[];
    albums: (Album & { addedAt: number })[];
    artists: (Artist & { addedAt: number })[];
    playlists: (Playlist & { addedAt: number })[];
    mine: MyPlaylist[];
    recents: RecentItem[];
    history: Track[];
}

const KEY = 'ui-next:library:v1';
const empty: LibraryState = { liked: [], albums: [], artists: [], playlists: [], mine: [], recents: [], history: [] };

function load(): LibraryState {
    try {
        const raw = localStorage.getItem(KEY);
        return raw ? { ...empty, ...JSON.parse(raw) } : empty;
    } catch {
        return empty;
    }
}

let state = load();
const listeners = new Set<() => void>();

function set(next: Partial<LibraryState>) {
    state = { ...state, ...next };
    try {
        localStorage.setItem(KEY, JSON.stringify(state));
    } catch (err) {
        console.warn('Could not save library', err);
    }
    listeners.forEach((l) => l());
}

/** Drop bulky provider objects from entities we only display. */
const slim = <T extends { raw?: unknown }>(o: T): T => ({ ...o, raw: undefined });

export const library = {
    get: () => state,
    subscribe(l: () => void) {
        listeners.add(l);
        return () => listeners.delete(l);
    },

    isLiked: (id: string) => state.liked.some((t) => t.id === id),
    toggleLike(track: Track) {
        const has = library.isLiked(track.id);
        set({ liked: has ? state.liked.filter((t) => t.id !== track.id) : [track, ...state.liked] });
        return !has;
    },

    isSaved: (kind: 'album' | 'artist' | 'playlist', id: string) =>
        (kind === 'album' ? state.albums : kind === 'artist' ? state.artists : state.playlists).some((x) => x.id === id),
    toggleAlbum(album: Album) {
        const has = library.isSaved('album', album.id);
        set({ albums: has ? state.albums.filter((a) => a.id !== album.id) : [{ ...slim(album), addedAt: Date.now() }, ...state.albums] });
        return !has;
    },
    toggleArtist(artist: Artist) {
        const has = library.isSaved('artist', artist.id);
        set({ artists: has ? state.artists.filter((a) => a.id !== artist.id) : [{ ...slim(artist), addedAt: Date.now() }, ...state.artists] });
        return !has;
    },
    togglePlaylist(p: Playlist) {
        const has = library.isSaved('playlist', p.id);
        set({ playlists: has ? state.playlists.filter((a) => a.id !== p.id) : [{ ...slim(p), addedAt: Date.now() }, ...state.playlists] });
        return !has;
    },

    createPlaylist(title?: string, tracks: Track[] = []) {
        const p: MyPlaylist = {
            id: Math.random().toString(36).slice(2, 10),
            title: title || `My Playlist #${state.mine.length + 1}`,
            description: '',
            tracks,
            createdAt: Date.now(),
        };
        set({ mine: [p, ...state.mine] });
        return p;
    },
    updatePlaylist(id: string, patch: Partial<Pick<MyPlaylist, 'title' | 'description'>>) {
        set({ mine: state.mine.map((p) => (p.id === id ? { ...p, ...patch } : p)) });
    },
    deletePlaylist(id: string) {
        set({ mine: state.mine.filter((p) => p.id !== id), recents: state.recents.filter((r) => !(r.kind === 'my-playlist' && r.id === id)) });
    },
    addToPlaylist(id: string, tracks: Track[]) {
        set({
            mine: state.mine.map((p) =>
                p.id === id ? { ...p, tracks: [...p.tracks, ...tracks.filter((t) => !p.tracks.some((x) => x.id === t.id))] } : p
            ),
        });
    },
    removeFromPlaylist(id: string, index: number) {
        set({ mine: state.mine.map((p) => (p.id === id ? { ...p, tracks: p.tracks.filter((_, i) => i !== index) } : p)) });
    },

    visit(item: Omit<RecentItem, 'at'>) {
        const rest = state.recents.filter((r) => !(r.kind === item.kind && r.id === item.id));
        set({ recents: [{ ...item, at: Date.now() }, ...rest].slice(0, 30) });
    },
    played(track: Track) {
        set({ history: [track, ...state.history.filter((t) => t.id !== track.id)].slice(0, 50) });
    },
};

export function useLibrary<T>(selector: (s: LibraryState) => T): T {
    return useSyncExternalStore(library.subscribe, () => selector(state));
}
