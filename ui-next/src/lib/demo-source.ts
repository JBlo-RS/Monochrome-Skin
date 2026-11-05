import type { Album, Artist, ArtistPage, MusicSource, Playlist, SearchResults, StreamInfo, Track } from './types';

/**
 * Offline catalogue of invented artists and albums. It lets the interface be explored
 * (and screenshotted) without network access: covers are generated SVGs and audio is
 * synthesised on the fly. Enable with ?demo=1.
 */

function rng(seed: number) {
    return () => {
        seed = (seed * 1664525 + 1013904223) % 4294967296;
        return seed / 4294967296;
    };
}
const hash = (s: string) => [...s].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7);

const PALETTES = [
    ['#ff6b6b', '#5f27cd'],
    ['#feca57', '#ff6b6b'],
    ['#1dd1a1', '#0a3d62'],
    ['#48dbfb', '#341f97'],
    ['#ff9ff3', '#3c40c6'],
    ['#f8c291', '#6a89cc'],
    ['#e55039', '#1e272e'],
    ['#78e08f', '#079992'],
    ['#fad390', '#b71540'],
    ['#82ccdd', '#0c2461'],
    ['#c7ecee', '#535c68'],
    ['#ffbe76', '#30336b'],
];

function coverSvg(seedText: string, label: string, round = false) {
    const r = rng(hash(seedText));
    const [a, b] = PALETTES[Math.floor(r() * PALETTES.length)];
    const shapes: string[] = [];
    const kind = Math.floor(r() * 3);
    for (let i = 0; i < 6; i++) {
        const x = Math.round(r() * 300);
        const y = Math.round(r() * 300);
        const s = Math.round(40 + r() * 140);
        const o = (0.12 + r() * 0.3).toFixed(2);
        if (kind === 0) shapes.push(`<circle cx="${x}" cy="${y}" r="${s / 2}" fill="#fff" opacity="${o}"/>`);
        else if (kind === 1)
            shapes.push(`<rect x="${x - s / 2}" y="${y - s / 2}" width="${s}" height="${s}" transform="rotate(${Math.round(r() * 90)} ${x} ${y})" fill="#fff" opacity="${o}"/>`);
        else shapes.push(`<path d="M0 ${y} Q150 ${y - s} 300 ${y + s / 3}" stroke="#fff" stroke-width="${6 + r() * 18}" fill="none" opacity="${o}"/>`);
    }
    const text = round
        ? ''
        : `<text x="20" y="276" font-family="Figtree,Arial,sans-serif" font-weight="800" font-size="26" fill="#fff" opacity=".92">${label
              .replace(/&/g, '&amp;')
              .replace(/</g, '&lt;')}</text>`;
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 300"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient></defs><rect width="300" height="300" fill="url(#g)"/>${shapes.join('')}${text}</svg>`;
    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

const ARTISTS: { name: string; albums: [string, string, number][] }[] = [
    { name: 'Velvet Static', albums: [['Night Transit', 'ALBUM', 2024], ['Glass Hours', 'ALBUM', 2021], ['Afterglow', 'SINGLE', 2025]] },
    { name: 'Juno Harbor', albums: [['Saltwater Letters', 'ALBUM', 2023], ['Lighthouse Keeper', 'EP', 2022]] },
    { name: 'The Paper Comets', albums: [['Fold & Fly', 'ALBUM', 2025], ['Origami Summer', 'ALBUM', 2020]] },
    { name: 'Mira Okafor', albums: [['Golden Hour Sermons', 'ALBUM', 2024], ['Undertow', 'SINGLE', 2025]] },
    { name: 'Low Orbit Club', albums: [['Telemetry', 'ALBUM', 2022], ['Zero-G Lullabies', 'EP', 2024]] },
    { name: 'Hollow Pines', albums: [['Cedar Smoke', 'ALBUM', 2023]] },
    { name: 'Kasumi Drift', albums: [['Neon Rain City', 'ALBUM', 2025], ['Arcade Hearts', 'SINGLE', 2024]] },
    { name: 'Bastian Rowe', albums: [['Kitchen Table Songs', 'ALBUM', 2021], ['Postcards', 'EP', 2023]] },
];

const WORDS = [
    'Midnight', 'Satellite', 'Paper', 'Ocean', 'Velvet', 'Summer', 'Ghost', 'Static', 'Golden', 'Wildfire', 'Echo',
    'Silver', 'Gravity', 'Lantern', 'Honey', 'Neon', 'Shadow', 'River', 'Comet', 'Harbor', 'Polaroid', 'Afterparty',
    'Daydream', 'Northern', 'Lights', 'Heartbeat', 'Backseat', 'Signal', 'Orchard', 'Bloom', 'Undertow', 'Skyline',
];

const artists: Artist[] = [];
const albums: Album[] = [];
const tracksByAlbum = new Map<string, Track[]>();
const allTracks: Track[] = [];

ARTISTS.forEach((a, ai) => {
    const artist: Artist = { id: `demo-ar-${ai}`, name: a.name, picture: coverSvg(`artist-${a.name}`, '', true) };
    artists.push(artist);
    a.albums.forEach(([title, type, year], bi) => {
        const id = `demo-al-${ai}-${bi}`;
        const cover = coverSvg(`album-${title}`, title);
        const r = rng(hash(title));
        const count = type === 'SINGLE' ? 1 : type === 'EP' ? 4 + Math.floor(r() * 2) : 8 + Math.floor(r() * 5);
        const album: Album = {
            id,
            title,
            cover,
            artists: [{ id: artist.id, name: artist.name }],
            releaseDate: `${year}-0${1 + Math.floor(r() * 9)}-1${Math.floor(r() * 9)}`,
            type,
            numberOfTracks: count,
            copyright: `℗ ${year} ${a.name}`,
        };
        const tracks: Track[] = [];
        for (let i = 0; i < count; i++) {
            const t = i === 0 ? title : `${WORDS[Math.floor(r() * WORDS.length)]} ${WORDS[Math.floor(r() * WORDS.length)]}`;
            const feat = r() > 0.82 ? ARTISTS[(ai + 3) % ARTISTS.length] : null;
            const track: Track = {
                id: `${id}-t${i}`,
                title: t,
                duration: 128 + Math.floor(r() * 140),
                explicit: r() > 0.85,
                quality: r() > 0.5 ? 'HI_RES_LOSSLESS' : 'LOSSLESS',
                artists: [
                    { id: artist.id, name: artist.name },
                    ...(feat ? [{ id: `demo-ar-${(ai + 3) % ARTISTS.length}`, name: feat.name }] : []),
                ],
                album: { id, title, cover },
                cover,
                raw: { popularity: Math.floor(r() * 100) },
            };
            tracks.push(track);
            allTracks.push(track);
        }
        album.duration = tracks.reduce((s, t) => s + t.duration, 0);
        tracksByAlbum.set(id, tracks);
        albums.push(album);
    });
});

const PLAYLISTS: [string, string][] = [
    ['Late Night Drive', 'Slow-burning synths for empty highways.'],
    ['Sunday Coffee', 'Warm acoustic mornings, no rush.'],
    ['Deep Focus', 'Keep calm and keep working.'],
    ['Fresh Finds', 'New sounds from artists on the rise.'],
    ['Indie Weekend', 'Guitars, hooks and sunburnt choruses.'],
    ['Rainy Day Lo-fi', 'Soft beats for grey skies.'],
];

const playlists: Playlist[] = PLAYLISTS.map(([title, description], i) => ({
    id: `demo-pl-${i}`,
    title,
    description,
    cover: coverSvg(`playlist-${title}`, title),
    owner: 'Monochrome',
    numberOfTracks: 18,
}));
const playlistTracks = new Map<string, Track[]>(
    playlists.map((p) => {
        const r = rng(hash(p.title));
        const picked = new Set<Track>();
        while (picked.size < 18) picked.add(allTracks[Math.floor(r() * allTracks.length)]);
        return [p.id, [...picked]];
    })
);

const audioCache = new Map<string, string>();

/** Renders a gentle chord progression to a WAV so the player has something real to play. */
function synth(track: Track) {
    const cached = audioCache.get(track.id);
    if (cached) return cached;
    const rate = 11025;
    const seconds = Math.min(track.duration, 75);
    const n = rate * seconds;
    const buf = new ArrayBuffer(44 + n * 2);
    const v = new DataView(buf);
    const w = (o: number, s: string) => [...s].forEach((c, i) => v.setUint8(o + i, c.charCodeAt(0)));
    w(0, 'RIFF');
    v.setUint32(4, 36 + n * 2, true);
    w(8, 'WAVEfmt ');
    v.setUint32(16, 16, true);
    v.setUint16(20, 1, true);
    v.setUint16(22, 1, true);
    v.setUint32(24, rate, true);
    v.setUint32(28, rate * 2, true);
    v.setUint16(32, 2, true);
    v.setUint16(34, 16, true);
    w(36, 'data');
    v.setUint32(40, n * 2, true);
    const r = rng(hash(track.id));
    const root = 196 * Math.pow(2, Math.floor(r() * 7) / 12);
    const prog = [0, 5, 7, 3].map((s) => root * Math.pow(2, s / 12));
    const bar = 2.4;
    for (let i = 0; i < n; i++) {
        const t = i / rate;
        const f = prog[Math.floor(t / bar) % prog.length];
        const inBar = (t % bar) / bar;
        const env = Math.min(1, inBar * 8) * (1 - inBar * 0.55);
        const fade = Math.min(1, t / 1.5, (seconds - t) / 2);
        const s =
            Math.sin(2 * Math.PI * f * t) * 0.32 +
            Math.sin(2 * Math.PI * f * 1.2599 * t) * 0.22 +
            Math.sin(2 * Math.PI * f * 1.4983 * t) * 0.2 +
            Math.sin(2 * Math.PI * (f / 2) * t) * 0.18;
        v.setInt16(44 + i * 2, Math.max(-1, Math.min(1, s * env * fade * 0.5)) * 32767, true);
    }
    const url = URL.createObjectURL(new Blob([buf], { type: 'audio/wav' }));
    audioCache.set(track.id, url);
    return url;
}

const delay = (ms = 120) => new Promise((r) => setTimeout(r, ms));
const match = (q: string, ...fields: string[]) => fields.some((f) => f.toLowerCase().includes(q));

export class DemoSource implements MusicSource {
    readonly name = 'demo' as const;
    async init() {}
    image(id: string | null | undefined) {
        return id ?? null;
    }
    async search(query: string): Promise<SearchResults> {
        await delay();
        const q = query.trim().toLowerCase();
        return {
            tracks: allTracks.filter((t) => match(q, t.title, ...t.artists.map((a) => a.name), t.album?.title ?? '')).slice(0, 20),
            albums: albums.filter((a) => match(q, a.title, ...a.artists.map((x) => x.name))),
            artists: artists.filter((a) => match(q, a.name)),
            playlists: playlists.filter((p) => match(q, p.title, p.description ?? '')),
        };
    }
    async getAlbum(id: string) {
        await delay();
        const album = albums.find((a) => a.id === id);
        if (!album) throw new Error('Album not found');
        return { album, tracks: tracksByAlbum.get(id) ?? [] };
    }
    async getArtist(id: string): Promise<ArtistPage> {
        await delay();
        const artist = artists.find((a) => a.id === id);
        if (!artist) throw new Error('Artist not found');
        const own = albums.filter((a) => a.artists[0].id === id);
        const top = allTracks
            .filter((t) => t.artists.some((a) => a.id === id))
            .sort((a, b) => ((b.raw as { popularity: number }).popularity ?? 0) - ((a.raw as { popularity: number }).popularity ?? 0))
            .slice(0, 10);
        return {
            artist,
            topTracks: top,
            albums: own.filter((a) => a.type === 'ALBUM'),
            singles: own.filter((a) => a.type !== 'ALBUM'),
            similar: artists.filter((a) => a.id !== id).slice(0, 6),
            bio: `${artist.name} make music for the hours after midnight: patient, melodic and built to be played loud on good headphones. This is an invented artist from Monochrome's demo catalogue.`,
        };
    }
    async getPlaylist(id: string) {
        await delay();
        const playlist = playlists.find((p) => p.id === id);
        if (!playlist) throw new Error('Playlist not found');
        return { playlist, tracks: playlistTracks.get(id) ?? [] };
    }
    async getRecommendations(track: Track) {
        await delay();
        const r = rng(hash(track.id));
        return [...allTracks].filter((t) => t.id !== track.id).sort(() => r() - 0.5).slice(0, 20);
    }
    async getStream(track: Track): Promise<StreamInfo> {
        return { url: synth(track), playbackType: 'direct', qualityDisplay: 'Demo' };
    }

    /** Extra demo-only data used to fill the home page. */
    featured() {
        return { albums, artists, playlists };
    }
}
