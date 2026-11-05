import type { ArtistPage, MusicSource, SearchResults, StreamInfo, Track } from './types';
import { items, toAlbum, toArtist, toPlaylist, toTracks } from './normalize';

/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Talks to the same music core the classic Monochrome UI uses (js/music-api.js + js/HiFi.ts),
 * so provider fallbacks, instance failover and stream resolution all stay identical.
 */
export class LiveSource implements MusicSource {
    readonly name = 'live' as const;
    private api: any = null;

    async init() {
        const [{ HiFiClient }, { MusicAPI }, { apiSettings }] = await Promise.all([
            import('@core/HiFi.ts'),
            import('@core/music-api.js'),
            import('@core/storage.js'),
        ]);
        try {
            await HiFiClient.initialize({
                storage: [localStorage],
                token: localStorage.getItem('hifi_token') || undefined,
                tokenExpiry: parseInt(localStorage.getItem('hifi_token_expiry') || '0'),
            });
        } catch (err) {
            console.warn('HiFiClient init failed', err);
        }
        await MusicAPI.initialize(apiSettings);
        this.api = MusicAPI.instance;
    }

    image(id: string | null | undefined, size = 320) {
        if (!id) return null;
        return this.api.getCoverUrl(id, String(size));
    }

    async search(query: string, signal?: AbortSignal): Promise<SearchResults> {
        const r = await this.api.search(query, { signal });
        return {
            tracks: toTracks(r?.tracks),
            albums: items(r?.albums, toAlbum),
            artists: items(r?.artists, toArtist),
            playlists: items(r?.playlists, toPlaylist),
        };
    }

    async getAlbum(id: string) {
        const r = await this.api.getAlbum(id);
        const album = toAlbum(r.album)!;
        const tracks = toTracks(r.tracks).map((t) => ({
            ...t,
            album: t.album ?? { id: album.id, title: album.title, cover: album.cover },
            cover: t.cover ?? album.cover,
        }));
        return { album, tracks };
    }

    async getArtist(id: string): Promise<ArtistPage> {
        const r = await this.api.getArtist(id);
        const artist = toArtist(r)!;
        const [similar, bio] = await Promise.all([
            this.api.getSimilarArtists(id).catch(() => []),
            this.api.getArtistBiography(id).catch(() => null),
        ]);
        return {
            artist: artist.picture ? artist : { ...artist, picture: r.albums?.[0]?.cover ?? null },
            topTracks: toTracks(r.tracks).slice(0, 10),
            albums: items(r.albums, toAlbum),
            singles: items(r.eps, toAlbum),
            similar: items(similar, toArtist),
            bio: typeof bio === 'string' ? bio : (bio?.text ?? null),
        };
    }

    async getPlaylist(id: string) {
        const r = await this.api.getPlaylist(id);
        return { playlist: toPlaylist(r.playlist)!, tracks: toTracks(r.tracks) };
    }

    async getRecommendations(track: Track) {
        const r = await this.api.getTrackRecommendations(track.id).catch(() => []);
        return toTracks(r);
    }

    async getStream(track: Track): Promise<StreamInfo> {
        const quality = localStorage.getItem('playback-quality') || 'LOSSLESS';
        const s = await this.api.getStreamUrl(track.id, quality, { track: track.raw });
        if (!s?.url) throw new Error('No audio source found');
        return s;
    }
}
