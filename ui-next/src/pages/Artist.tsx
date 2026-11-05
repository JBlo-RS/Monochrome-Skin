import { useEffect, useState } from 'react';
import { source } from '../lib/source';
import { useAsync } from '../lib/useAsync';
import { ActionBar, useHeaderColor } from '../components/PageHeader';
import { TrackList } from '../components/TrackList';
import { PlayButton } from '../components/PlayButton';
import { Icon } from '../components/Icon';
import { Img } from '../components/Img';
import { Shelf } from '../components/Card';
import { AlbumYearCard, ArtistCard } from './Home';
import { usePlayer, player } from '../state/player';
import { library, useLibrary } from '../state/library';
import { openMenu } from '../state/menu';
import { entityMenu, playEntity, toggleSave } from '../lib/actions';
import { ErrorState, Loading } from './States';

export function ArtistPage({ id }: { id: string }) {
    const { data, error, loading } = useAsync(() => source.getArtist(id), [id]);
    const color = useHeaderColor(data?.artist.picture);
    const following = useLibrary((s) => s.artists.some((a) => a.id === id));
    const playing = usePlayer((s) => s.playing && s.context?.kind === 'artist' && s.context.id === id);
    const shuffle = usePlayer((s) => s.shuffle);
    const [showAll, setShowAll] = useState(false);
    const [disco, setDisco] = useState<'albums' | 'singles'>('albums');
    const [bioOpen, setBioOpen] = useState(false);

    useEffect(() => {
        setShowAll(false);
        setDisco('albums');
    }, [id]);
    useEffect(() => {
        if (data) library.visit({ kind: 'artist', id, title: data.artist.name, subtitle: 'Artist', image: data.artist.picture });
    }, [data, id]);

    if (loading) return <Loading />;
    if (error || !data) return <ErrorState what="artist" />;
    const { artist, topTracks, albums, singles, similar, bio } = data;
    const releases = disco === 'albums' && albums.length ? albums : singles.length ? singles : albums;
    const cleanBio = bio?.replace(/\[[^\]]*]/g, '').replace(/<[^>]+>/g, '').trim();

    return (
        <div className="entity-page artist-page">
            <header className="artist-hero" style={{ '--hdr': color } as React.CSSProperties}>
                <div className="hero-bg">
                    <Img id={artist.picture} size={1280} />
                </div>
                <div className="hero-text">
                    <span className="verified">
                        <Icon name="checkCircle" size={22} /> Artist
                    </span>
                    <h1 className={`ph-title ${artist.name.length > 18 ? 'md' : 'lg'}`}>{artist.name}</h1>
                </div>
            </header>
            <ActionBar color={color}>
                <PlayButton playing={playing} onClick={() => playEntity('artist', id, artist.name)} />
                <button className={`icon-btn toggle ${shuffle ? 'on' : ''}`} onClick={player.toggleShuffle} aria-pressed={shuffle} aria-label="Shuffle" title="Shuffle">
                    <Icon name="shuffle" size={28} />
                </button>
                <button className="btn-outline" onClick={() => toggleSave('artist', artist)} aria-pressed={following}>
                    {following ? 'Following' : 'Follow'}
                </button>
                <button className="icon-btn" onClick={(e) => openMenu(e, entityMenu('artist', id, artist.name, artist))} aria-label={`More options for ${artist.name}`}>
                    <Icon name="more" size={32} />
                </button>
            </ActionBar>
            <div className="page-body">
                {topTracks.length > 0 && (
                    <section className="popular">
                        <h2>Popular</h2>
                        <TrackList
                            tracks={showAll ? topTracks : topTracks.slice(0, 5)}
                            context={{ kind: 'artist', id, title: artist.name }}
                            showAlbum={false}
                            showHeader={false}
                            showArtists={false}
                        />
                        {topTracks.length > 5 && (
                            <button className="link-btn strong" onClick={() => setShowAll(!showAll)}>
                                {showAll ? 'Show less' : 'See more'}
                            </button>
                        )}
                    </section>
                )}
                {(albums.length > 0 || singles.length > 0) && (
                    <section className="shelf">
                        <header>
                            <h2>Discography</h2>
                        </header>
                        <div className="chips">
                            {albums.length > 0 && (
                                <button className={`chip ${disco === 'albums' ? 'on' : ''}`} onClick={() => setDisco('albums')}>
                                    Albums
                                </button>
                            )}
                            {singles.length > 0 && (
                                <button className={`chip ${disco === 'singles' || !albums.length ? 'on' : ''}`} onClick={() => setDisco('singles')}>
                                    Singles and EPs
                                </button>
                            )}
                        </div>
                        <div className="card-row">
                            {releases.map((a) => (
                                <AlbumYearCard key={a.id} album={a} />
                            ))}
                        </div>
                    </section>
                )}
                {similar.length > 0 && (
                    <Shelf title="Fans also like">
                        {similar.slice(0, 10).map((a) => (
                            <ArtistCard key={a.id} artist={a} />
                        ))}
                    </Shelf>
                )}
                {cleanBio && (
                    <section className="about">
                        <h2>About</h2>
                        <button className={`about-card ${bioOpen ? 'open' : ''}`} onClick={() => setBioOpen(!bioOpen)} aria-expanded={bioOpen}>
                            <Img id={artist.picture} size={640} />
                            <p>{cleanBio}</p>
                        </button>
                    </section>
                )}
            </div>
        </div>
    );
}
