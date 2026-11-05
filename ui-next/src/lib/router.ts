import { useEffect, useState } from 'react';

export type Route =
    | { name: 'home' }
    | { name: 'search'; query: string }
    | { name: 'album'; id: string }
    | { name: 'artist'; id: string }
    | { name: 'playlist'; id: string }
    | { name: 'my-playlist'; id: string }
    | { name: 'liked' }
    | { name: 'queue' }
    | { name: 'library' }
    | { name: 'settings' };

export function parse(hash = location.hash): Route {
    const [path, qs] = hash.replace(/^#\/?/, '').split('?');
    const [head, ...rest] = path.split('/');
    const id = decodeURIComponent(rest.join('/'));
    switch (head) {
        case 'search':
            return { name: 'search', query: new URLSearchParams(qs).get('q') ?? '' };
        case 'album':
        case 'artist':
        case 'playlist':
        case 'my-playlist':
            return { name: head, id };
        case 'liked':
        case 'queue':
        case 'library':
        case 'settings':
            return { name: head };
        default:
            return { name: 'home' };
    }
}

export function href(route: Route): string {
    switch (route.name) {
        case 'home':
            return '#/';
        case 'search':
            return route.query ? `#/search?q=${encodeURIComponent(route.query)}` : '#/search';
        case 'album':
        case 'artist':
        case 'playlist':
        case 'my-playlist':
            return `#/${route.name}/${encodeURIComponent(route.id)}`;
        default:
            return `#/${route.name}`;
    }
}

export function navigate(route: Route | string, replace = false) {
    const h = typeof route === 'string' ? route : href(route);
    if (replace) history.replaceState(null, '', h);
    else location.hash = h;
    if (replace) window.dispatchEvent(new HashChangeEvent('hashchange'));
}

export function useRoute() {
    const [route, setRoute] = useState(() => parse());
    useEffect(() => {
        const on = () => setRoute(parse());
        window.addEventListener('hashchange', on);
        return () => window.removeEventListener('hashchange', on);
    }, []);
    return route;
}
