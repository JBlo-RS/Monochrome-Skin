import type { Album, Artist, Playlist, Track } from './types';
import { source } from './source';
import { player, isContextPlaying, type PlayContext } from '../state/player';
import { library } from '../state/library';
import { toast } from '../state/toast';
import { navigate } from './router';
import type { MenuItem } from '../state/menu';

export type EntityKind = 'album' | 'artist' | 'playlist' | 'my-playlist' | 'liked';

export async function tracksFor(kind: EntityKind, id: string): Promise<Track[]> {
    switch (kind) {
        case 'album':
            return (await source.getAlbum(id)).tracks;
        case 'artist':
            return (await source.getArtist(id)).topTracks;
        case 'playlist':
            return (await source.getPlaylist(id)).tracks;
        case 'my-playlist':
            return library.get().mine.find((p) => p.id === id)?.tracks ?? [];
        case 'liked':
            return library.get().liked;
    }
}

/** Play/pause an album, artist or playlist from a card or header button. */
export async function playEntity(kind: EntityKind, id: string, title: string) {
    if (isContextPlaying(kind, id)) return player.toggle();
    try {
        const tracks = await tracksFor(kind, id);
        if (!tracks.length) return toast('Nothing to play here yet');
        player.playList(tracks, player.get().shuffle ? Math.floor(Math.random() * tracks.length) : 0, { kind, id, title });
    } catch {
        toast("Couldn't load that right now");
    }
}

function share(path: string) {
    const url = `${location.origin}${location.pathname}${path}`;
    navigator.clipboard?.writeText(url).then(
        () => toast('Link copied to clipboard'),
        () => toast(url)
    );
}

function playlistSubmenu(tracks: Track[]): MenuItem[] {
    const mine = library.get().mine;
    return [
        {
            label: 'New playlist',
            onSelect: () => {
                const p = library.createPlaylist(undefined, tracks);
                toast(`Added to ${p.title}`);
            },
        },
        ...(mine.length ? [{ label: '', separator: true }] : []),
        ...mine.map((p) => ({
            label: p.title,
            onSelect: () => {
                library.addToPlaylist(p.id, tracks);
                toast(`Added to ${p.title}`);
            },
        })),
    ];
}

export function trackMenu(track: Track, extra: MenuItem[] = []): MenuItem[] {
    const liked = library.isLiked(track.id);
    const artist = track.artists.find((a) => a.id);
    return [
        { label: 'Add to playlist', submenu: playlistSubmenu([track]) },
        { label: liked ? 'Remove from Liked Songs' : 'Save to Liked Songs', onSelect: () => toggleLike(track) },
        { label: 'Add to queue', onSelect: () => player.addToQueue([track]) },
        { label: 'Play next', onSelect: () => player.playNext([track]) },
        { label: 'Start song radio', onSelect: () => startRadio(track) },
        { label: '', separator: true },
        ...(artist ? [{ label: 'Go to artist', onSelect: () => navigate({ name: 'artist', id: artist.id }) }] : []),
        ...(track.album?.id ? [{ label: 'Go to album', onSelect: () => navigate({ name: 'album', id: track.album!.id }) }] : []),
        ...(track.album?.id ? [{ label: 'Copy album link', onSelect: () => share(`#/album/${encodeURIComponent(track.album!.id)}`) }] : []),
        ...(extra.length ? [{ label: '', separator: true }, ...extra] : []),
    ];
}

export function entityMenu(kind: EntityKind, id: string, title: string, entity?: Album | Artist | Playlist): MenuItem[] {
    const items: MenuItem[] = [
        {
            label: 'Add to queue',
            onSelect: async () => player.addToQueue(await tracksFor(kind, id)),
        },
        {
            label: 'Add to playlist',
            submenu: [
                {
                    label: 'New playlist',
                    onSelect: async () => {
                        const p = library.createPlaylist(title, await tracksFor(kind, id));
                        toast(`Created ${p.title}`);
                    },
                },
                ...library.get().mine.map((p) => ({
                    label: p.title,
                    onSelect: async () => {
                        library.addToPlaylist(p.id, await tracksFor(kind, id));
                        toast(`Added to ${p.title}`);
                    },
                })),
            ],
        },
    ];
    if (entity && kind === 'album') {
        const saved = library.isSaved('album', id);
        items.push({ label: saved ? 'Remove from Your Library' : 'Add to Your Library', onSelect: () => toggleSave('album', entity) });
    }
    if (entity && kind === 'playlist') {
        const saved = library.isSaved('playlist', id);
        items.push({ label: saved ? 'Remove from Your Library' : 'Add to Your Library', onSelect: () => toggleSave('playlist', entity) });
    }
    if (entity && kind === 'artist') {
        const saved = library.isSaved('artist', id);
        items.push({ label: saved ? 'Unfollow' : 'Follow', onSelect: () => toggleSave('artist', entity) });
    }
    if (kind !== 'my-playlist' && kind !== 'liked') items.push({ label: 'Copy link', onSelect: () => share(`#/${kind}/${encodeURIComponent(id)}`) });
    if (kind === 'my-playlist')
        items.push(
            { label: '', separator: true },
            {
                label: 'Delete playlist',
                danger: true,
                onSelect: () => {
                    if (!confirm(`Delete "${title}"?`)) return;
                    library.deletePlaylist(id);
                    toast('Playlist deleted');
                    if (location.hash.includes(id)) navigate({ name: 'home' });
                },
            }
        );
    return items;
}

export function toggleLike(track: Track) {
    toast(library.toggleLike(track) ? 'Added to Liked Songs' : 'Removed from Liked Songs');
}

export function toggleSave(kind: 'album' | 'artist' | 'playlist', entity: Album | Artist | Playlist) {
    const added =
        kind === 'album'
            ? library.toggleAlbum(entity as Album)
            : kind === 'artist'
              ? library.toggleArtist(entity as Artist)
              : library.togglePlaylist(entity as Playlist);
    toast(kind === 'artist' ? (added ? 'Following' : 'Unfollowed') : added ? 'Added to Your Library' : 'Removed from Your Library');
}

export async function startRadio(track: Track) {
    const recs = await source.getRecommendations(track).catch(() => []);
    const ctx: PlayContext = { kind: 'radio', id: track.id, title: `${track.title} Radio` };
    player.playList([track, ...recs.filter((t) => t.id !== track.id)], 0, ctx);
    if (!recs.length) toast('No similar songs found');
}
