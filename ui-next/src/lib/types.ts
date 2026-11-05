/** Normalised shapes the UI works with. `raw` keeps the provider object for the music core. */
export interface ArtistRef {
    id: string;
    name: string;
}

export interface Artist extends ArtistRef {
    picture: string | null;
    raw?: unknown;
}

export interface AlbumRef {
    id: string;
    title: string;
    cover: string | null;
}

export interface Track {
    id: string;
    title: string;
    version?: string | null;
    duration: number;
    explicit: boolean;
    quality?: string | null;
    artists: ArtistRef[];
    album: AlbumRef | null;
    cover: string | null;
    raw: unknown;
}

export interface Album {
    id: string;
    title: string;
    cover: string | null;
    artists: ArtistRef[];
    releaseDate?: string | null;
    type?: string | null;
    numberOfTracks?: number | null;
    duration?: number | null;
    copyright?: string | null;
    raw?: unknown;
}

export interface Playlist {
    id: string;
    title: string;
    description?: string | null;
    cover: string | null;
    owner?: string | null;
    numberOfTracks?: number | null;
    raw?: unknown;
}

export interface SearchResults {
    tracks: Track[];
    albums: Album[];
    artists: Artist[];
    playlists: Playlist[];
}

export interface ArtistPage {
    artist: Artist;
    topTracks: Track[];
    albums: Album[];
    singles: Album[];
    similar: Artist[];
    bio?: string | null;
}

export interface StreamInfo {
    url: string;
    playbackType?: string;
    mediaMimeType?: string;
    qualityDisplay?: string;
}

export interface MusicSource {
    readonly name: 'live' | 'demo';
    init(): Promise<void>;
    search(query: string, signal?: AbortSignal): Promise<SearchResults>;
    getAlbum(id: string): Promise<{ album: Album; tracks: Track[] }>;
    getArtist(id: string): Promise<ArtistPage>;
    getPlaylist(id: string): Promise<{ playlist: Playlist; tracks: Track[] }>;
    getRecommendations(track: Track): Promise<Track[]>;
    getStream(track: Track): Promise<StreamInfo>;
    image(id: string | null | undefined, size?: number): string | null;
}
