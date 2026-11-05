# Monochrome Next

A new streaming-app style interface for Monochrome, written in React + TypeScript.
It reuses the existing music code in `../js` (`MusicAPI`, `HiFiClient`), so search,
provider fallbacks and stream resolution work the same as in the classic UI.

## Run it

```bash
# once, from the repository root (shared music code dependencies)
bun install
# once, in this folder (React)
cd ui-next && bun install
# start the dev server on http://localhost:5180
bunx vite
```

Add `?demo=1` to the URL to use the built-in demo catalogue (invented artists,
generated covers, synthesised audio) when you are offline. `?demo=0` switches back.
The same toggle is in Settings.

Build for production with `bunx vite build` (output in `ui-next/dist`).

## What's in it

- Three-panel layout: Your Library sidebar, main view, and a Now Playing / Queue panel
- Player bar with shuffle, repeat (all / one), seek, volume and a full-screen player
- Home with recently played, recommendations based on what you listened to, and featured shelves
- Search with top result, songs, artists, albums and playlists, plus genre tiles and recent searches
- Album, artist and playlist pages with colour headers taken from the artwork
- Liked Songs, saved albums/artists/playlists and your own playlists (stored in this browser)
- Right-click menus: add to playlist, add to queue, play next, start radio, go to artist/album
- Autoplay of similar songs when your queue ends
- OS media controls (Media Session) and keyboard shortcuts:
  Space play/pause, Ctrl/Cmd+K search, Ctrl/Cmd+←/→ previous/next, Shift+←/→ seek 10s
- Phone layout with bottom navigation, mini player and full-screen player

## Layout

```
src/
  lib/         data sources (live + demo), normalisers, router, helpers
  state/       player engine, library, menus, toasts (small external stores)
  components/  shell pieces: sidebar, top bar, player bar, side panel, track list, cards
  pages/       home, search, album, artist, playlist, liked, library, settings
  styles.css   all styling; colours are CSS variables at the top (--accent etc.)
```

To change the accent colour, edit `--accent` in `src/styles.css`.
