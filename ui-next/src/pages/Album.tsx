import { useEffect } from 'react';
import { source } from '../lib/source';
import { useAsync } from '../lib/useAsync';
import { ActionBar, Dot, PageHeader, useHeaderColor } from '../components/PageHeader';
import { TrackList } from '../components/TrackList';
import { PlayButton } from '../components/PlayButton';
import { Icon } from '../components/Icon';
import { Img } from '../components/Img';
import { ArtistLinks } from '../components/Links';
import { Shelf } from '../components/Card';
import { AlbumYearCard } from './Home';
import { usePlayer } from '../state/player';
import { library, useLibrary } from '../state/library';
import { openMenu } from '../state/menu';
import { entityMenu, playEntity, toggleSave } from '../lib/actions';
import { albumType, longDuration, plural, year } from '../lib/format';
import { ErrorState, Loading } from './States';

export function AlbumPage({ id }: { id: string }) {
    const { data, error, loading } = useAsync(() => source.getAlbum(id), [id]);
    const color = useHeaderColor(data?.album.cover);
    const saved = useLibrary((s) => s.albums.some((a) => a.id === id));
    const playing = usePlayer((s) => s.playing && s.context?.kind === 'album' && s.context.id === id);
    const mainArtist = data?.album.artists.find((a) => a.id);
    const more = useAsync(() => (mainArtist ? source.getArtist(mainArtist.id) : Promise.resolve(null)), [mainArtist?.id]);

    useEffect(() => {
        if (data)
            library.visit({
                kind: 'album',
                id,
                title: data.album.title,
                subtitle: data.album.artists.map((a) => a.name).join(', '),
                image: data.album.cover,
            });
    }, [data, id]);

    if (loading) return <Loading />;
    if (error || !data) return <ErrorState what="album" />;
    const { album, tracks } = data;
    const total = album.duration || tracks.reduce((s, t) => s + t.duration, 0);
    const artistPic = more.data?.artist.picture;
    const others = [...(more.data?.albums ?? []), ...(more.data?.singles ?? [])].filter((a) => a.id !== id);

    return (
        <div className="entity-page">
            <PageHeader
                image={album.cover}
                kind={albumType(album.type)}
                title={album.title}
                color={color}
                fallback="album"
                meta={
                    <>
                        {artistPic && <Img id={artistPic} size={80} round className="ph-avatar" />}
                        <ArtistLinks artists={album.artists} className="strong" />
                        {album.releaseDate && (
                            <>
                                <Dot />
                                <span>{year(album.releaseDate)}</span>
                            </>
                        )}
                        <Dot />
                        <span>
                            {plural(tracks.length, 'song')}, <span className="muted">{longDuration(total)}</span>
                        </span>
                    </>
                }
            />
            <ActionBar color={color}>
                <PlayButton playing={playing} onClick={() => playEntity('album', id, album.title)} />
                <button className={`icon-btn save ${saved ? 'on' : ''}`} onClick={() => toggleSave('album', album)} aria-pressed={saved} aria-label={saved ? 'Remove from Your Library' : 'Save to Your Library'} title={saved ? 'Remove from Your Library' : 'Save to Your Library'}>
                    <Icon name={saved ? 'checkCircle' : 'addCircle'} size={32} />
                </button>
                <button className="icon-btn" onClick={(e) => openMenu(e, entityMenu('album', id, album.title, album))} aria-label={`More options for ${album.title}`}>
                    <Icon name="more" size={32} />
                </button>
            </ActionBar>
            <div className="page-body">
                <TrackList tracks={tracks} context={{ kind: 'album', id, title: album.title }} showCover={false} showAlbum={false} />
                <footer className="album-foot">
                    {album.releaseDate && (
                        <p>
                            {new Date(album.releaseDate).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
                        </p>
                    )}
                    {album.copyright && <small>{album.copyright}</small>}
                </footer>
                {mainArtist && others.length > 0 && (
                    <Shelf title={`More by ${mainArtist.name}`}>
                        {others.slice(0, 10).map((a) => (
                            <AlbumYearCard key={a.id} album={a} />
                        ))}
                    </Shelf>
                )}
            </div>
        </div>
    );
}
