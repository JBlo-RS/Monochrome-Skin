import { useSyncExternalStore } from 'react';
import type { Track } from '../lib/types';
import { source } from '../lib/source';
import { library } from './library';
import { toast } from './toast';

export type Repeat = 'off' | 'all' | 'one';
export interface PlayContext {
    kind: 'album' | 'artist' | 'playlist' | 'my-playlist' | 'liked' | 'search' | 'radio' | 'queue';
    id: string;
    title: string;
}

interface PlayerState {
    current: Track | null;
    /** The context's tracks in play order (shuffled when shuffle is on). */
    queue: Track[];
    /** Unshuffled order, so shuffle can be turned off again. */
    original: Track[];
    index: number;
    /** Tracks the user queued by hand; they play before the context continues. */
    upNext: Track[];
    context: PlayContext | null;
    playing: boolean;
    loading: boolean;
    time: number;
    duration: number;
    volume: number;
    muted: boolean;
    shuffle: boolean;
    repeat: Repeat;
    autoplay: boolean;
    quality: string | null;
}

const SAVE_KEY = 'ui-next:player:v1';
const saved = (() => {
    try {
        return JSON.parse(localStorage.getItem(SAVE_KEY) || '{}');
    } catch {
        return {};
    }
})();

let state: PlayerState = {
    current: saved.current ?? null,
    queue: saved.queue ?? [],
    original: saved.original ?? saved.queue ?? [],
    index: saved.index ?? -1,
    upNext: saved.upNext ?? [],
    context: saved.context ?? null,
    playing: false,
    loading: false,
    time: saved.time ?? 0,
    duration: saved.current?.duration ?? 0,
    volume: saved.volume ?? 0.8,
    muted: false,
    shuffle: saved.shuffle ?? false,
    repeat: saved.repeat ?? 'off',
    autoplay: saved.autoplay ?? true,
    quality: null,
};

const listeners = new Set<() => void>();
let saveTimer: number | undefined;
function set(patch: Partial<PlayerState>) {
    state = { ...state, ...patch };
    listeners.forEach((l) => l());
    clearTimeout(saveTimer);
    saveTimer = window.setTimeout(persist, 800);
}
function persist() {
    const { current, queue, original, index, upNext, context, time, volume, shuffle, repeat, autoplay } = state;
    try {
        localStorage.setItem(
            SAVE_KEY,
            JSON.stringify({ current, queue: queue.slice(0, 500), original: original.slice(0, 500), index, upNext, context, time, volume, shuffle, repeat, autoplay })
        );
    } catch {
        /* storage full: playback still works */
    }
}

// ─── Audio element ──────────────────────────────────────────────────────────

const audio = new Audio();
audio.preload = 'auto';
audio.volume = state.volume;
let shaka: { destroy(): Promise<void> } | null = null;
let loadSeq = 0;
let failures = 0;
let pendingSeek = state.current ? state.time : 0;
let loadedId: string | null = null;

audio.addEventListener('timeupdate', () => set({ time: audio.currentTime }));
audio.addEventListener('durationchange', () => Number.isFinite(audio.duration) && set({ duration: audio.duration }));
audio.addEventListener('play', () => set({ playing: true }));
audio.addEventListener('pause', () => set({ playing: false }));
audio.addEventListener('waiting', () => set({ loading: true }));
audio.addEventListener('playing', () => {
    failures = 0;
    set({ loading: false });
});
audio.addEventListener('canplay', () => set({ loading: false }));
audio.addEventListener('ended', () => {
    if (state.repeat === 'one') {
        audio.currentTime = 0;
        void audio.play();
    } else void next(true);
});
audio.addEventListener('error', () => {
    if (!audio.src || loadedId !== state.current?.id) return;
    onFailure(new Error(audio.error?.message || 'Playback error'));
});

function onFailure(err: unknown) {
    console.warn('Playback failed', err);
    set({ loading: false, playing: false });
    failures++;
    toast(`Couldn't play "${state.current?.title ?? 'track'}"`);
    if (failures < 3 && hasNext()) void next(true);
}

async function attach(track: Track, autoplay: boolean) {
    const seq = ++loadSeq;
    set({ loading: true, quality: null });
    try {
        const stream = await source.getStream(track);
        if (seq !== loadSeq) return;
        if (shaka) {
            await shaka.destroy().catch(() => {});
            shaka = null;
        }
        const type = String(stream.playbackType || '').toLowerCase();
        const isHls = type === 'hls' || stream.url.includes('.m3u8');
        const isDash = type.includes('dash') || stream.url.includes('.mpd');
        loadedId = track.id;
        if ((isDash || isHls) && !(isHls && audio.canPlayType('application/vnd.apple.mpegurl'))) {
            const lib = (await import('shaka-player')).default;
            lib.polyfill.installAll();
            const player = new lib.Player();
            await player.attach(audio);
            await player.load(stream.url);
            shaka = player;
        } else {
            audio.src = stream.url;
        }
        set({ quality: stream.qualityDisplay ?? null });
        if (pendingSeek) {
            audio.currentTime = pendingSeek;
            pendingSeek = 0;
        }
        if (autoplay) await audio.play();
        else set({ loading: false });
    } catch (err) {
        if (seq !== loadSeq) return;
        if ((err as Error)?.name === 'NotAllowedError') {
            set({ loading: false });
            return;
        }
        onFailure(err);
    }
}

function start(track: Track, autoplay = true) {
    set({ current: track, time: 0, duration: track.duration, playing: false });
    library.played(track);
    updateMediaSession(track);
    void attach(track, autoplay);
}

function shuffled<T>(list: T[], first?: T): T[] {
    const rest = list.filter((x) => x !== first);
    for (let i = rest.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [rest[i], rest[j]] = [rest[j], rest[i]];
    }
    return first ? [first, ...rest] : rest;
}

function hasNext() {
    return state.upNext.length > 0 || state.index < state.queue.length - 1 || state.repeat === 'all';
}

// ─── Public API ─────────────────────────────────────────────────────────────

export async function next(auto = false) {
    if (state.upNext.length) {
        const [t, ...rest] = state.upNext;
        set({ upNext: rest });
        return start(t);
    }
    let i = state.index + 1;
    if (i >= state.queue.length) {
        if (state.repeat === 'all' && state.queue.length) i = 0;
        else if (auto && state.autoplay && state.current) return radio(state.current);
        else {
            audio.pause();
            audio.currentTime = 0;
            return;
        }
    }
    set({ index: i });
    start(state.queue[i]);
}

export function prev() {
    if (audio.currentTime > 3 || state.index <= 0) {
        if (!state.current) return;
        audio.currentTime = 0;
        if (!loadedId) void attach(state.current, true);
        return;
    }
    const i = state.index - 1;
    set({ index: i });
    start(state.queue[i]);
}

async function radio(seed: Track) {
    const recs = await source.getRecommendations(seed).catch(() => []);
    const fresh = recs.filter((t) => !state.queue.some((q) => q.id === t.id));
    if (!fresh.length) return;
    toast('Autoplay: playing similar songs');
    const queue = [...state.queue, ...fresh];
    set({ queue, original: [...state.original, ...fresh], index: state.index + 1 });
    start(queue[state.index]);
}

export const player = {
    get: () => state,
    subscribe(l: () => void) {
        listeners.add(l);
        return () => listeners.delete(l);
    },

    /** Play a list of tracks, starting at `index`. */
    playList(tracks: Track[], index = 0, context: PlayContext | null = null) {
        if (!tracks.length) return;
        const first = tracks[Math.max(0, Math.min(index, tracks.length - 1))];
        const queue = state.shuffle ? shuffled(tracks, first) : tracks;
        set({ queue, original: tracks, index: queue.indexOf(first), context });
        start(first);
    },

    toggle() {
        if (!state.current) return;
        if (loadedId !== state.current.id) return void attach(state.current, true);
        if (audio.paused) void audio.play().catch(onFailure);
        else audio.pause();
    },
    pause: () => audio.pause(),
    next: () => next(),
    prev,
    seek(sec: number) {
        if (!loadedId) pendingSeek = sec;
        else audio.currentTime = sec;
        set({ time: sec });
    },
    setVolume(v: number) {
        audio.volume = Math.max(0, Math.min(1, v));
        audio.muted = false;
        set({ volume: audio.volume, muted: false });
    },
    toggleMute() {
        audio.muted = !audio.muted;
        set({ muted: audio.muted });
    },
    toggleShuffle() {
        const on = !state.shuffle;
        const cur = state.queue[state.index];
        const queue = on ? shuffled(state.original, cur) : state.original;
        set({ shuffle: on, queue, index: Math.max(0, queue.indexOf(cur)) });
    },
    cycleRepeat() {
        set({ repeat: state.repeat === 'off' ? 'all' : state.repeat === 'all' ? 'one' : 'off' });
    },
    toggleAutoplay() {
        set({ autoplay: !state.autoplay });
    },
    addToQueue(tracks: Track[]) {
        set({ upNext: [...state.upNext, ...tracks] });
        toast(tracks.length === 1 ? 'Added to queue' : `Added ${tracks.length} songs to queue`);
    },
    playNext(tracks: Track[]) {
        set({ upNext: [...tracks, ...state.upNext] });
        toast('Will play next');
    },
    removeUpNext(i: number) {
        set({ upNext: state.upNext.filter((_, j) => j !== i) });
    },
    clearUpNext() {
        set({ upNext: [] });
    },
    jumpTo(i: number) {
        if (!state.queue[i]) return;
        set({ index: i });
        start(state.queue[i]);
    },
    jumpToUpNext(i: number) {
        const t = state.upNext[i];
        if (!t) return;
        set({ upNext: state.upNext.slice(i + 1) });
        start(t);
    },
};

export function usePlayer<T>(selector: (s: PlayerState) => T): T {
    return useSyncExternalStore(player.subscribe, () => selector(state));
}

export function isContextPlaying(kind: PlayContext['kind'], id: string) {
    return state.context?.kind === kind && state.context.id === id;
}

// ─── OS media controls ─────────────────────────────────────────────────────

function updateMediaSession(track: Track) {
    if (!('mediaSession' in navigator)) return;
    const art = source.image(track.cover, 640);
    navigator.mediaSession.metadata = new MediaMetadata({
        title: track.title,
        artist: track.artists.map((a) => a.name).join(', '),
        album: track.album?.title ?? '',
        artwork: art ? [{ src: art, sizes: '640x640', type: 'image/jpeg' }] : [],
    });
}

if ('mediaSession' in navigator) {
    const ms = navigator.mediaSession;
    ms.setActionHandler('play', () => player.toggle());
    ms.setActionHandler('pause', () => audio.pause());
    ms.setActionHandler('nexttrack', () => void next());
    ms.setActionHandler('previoustrack', () => prev());
    ms.setActionHandler('seekto', (d) => d.seekTime !== undefined && player.seek(d.seekTime));
    if (state.current) updateMediaSession(state.current);
}

window.addEventListener('beforeunload', persist);
