import { useEffect, useRef, useState } from 'react';
import { Icon } from './Icon';
import { navigate, useRoute } from '../lib/router';
import { isDemo } from '../lib/source';

export function TopBar() {
    const route = useRoute();
    const [q, setQ] = useState(route.name === 'search' ? route.query : '');
    const input = useRef<HTMLInputElement>(null);
    const timer = useRef<number>();

    useEffect(() => {
        setQ(route.name === 'search' ? route.query : '');
    }, [route]);

    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
                e.preventDefault();
                input.current?.focus();
                input.current?.select();
            }
        };
        addEventListener('keydown', onKey);
        return () => removeEventListener('keydown', onKey);
    }, []);

    const update = (value: string) => {
        setQ(value);
        clearTimeout(timer.current);
        timer.current = window.setTimeout(() => navigate({ name: 'search', query: value.trim() }, route.name === 'search'), 300);
    };

    return (
        <div className="topbar">
            <div className="tb-left">
                <a className="logo" href="#/" aria-label="Monochrome home">
                    <img src="logo.png" alt="" width={32} height={32} />
                </a>
                <button className="round-btn dim" onClick={() => history.back()} aria-label="Go back">
                    <Icon name="chevronLeft" size={18} />
                </button>
                <button className="round-btn dim" onClick={() => history.forward()} aria-label="Go forward">
                    <Icon name="chevronRight" size={18} />
                </button>
            </div>
            <div className="tb-center">
                <a className={`round-btn home ${route.name === 'home' ? 'on' : ''}`} href="#/" aria-label="Home" title="Home">
                    <Icon name={route.name === 'home' ? 'home' : 'homeOutline'} />
                </a>
                <form
                    className="search-box"
                    role="search"
                    onSubmit={(e) => {
                        e.preventDefault();
                        clearTimeout(timer.current);
                        navigate({ name: 'search', query: q.trim() });
                    }}
                >
                    <Icon name="search" className="sb-icon" />
                    <input
                        ref={input}
                        value={q}
                        onChange={(e) => update(e.target.value)}
                        onFocus={() => route.name !== 'search' && navigate({ name: 'search', query: q.trim() })}
                        placeholder="What do you want to play?"
                        aria-label="Search"
                        spellCheck={false}
                    />
                    {q ? (
                        <button type="button" className="icon-btn sb-clear" onClick={() => update('')} aria-label="Clear search">
                            <Icon name="close" size={20} />
                        </button>
                    ) : (
                        <kbd className="sb-kbd">Ctrl K</kbd>
                    )}
                </form>
            </div>
            <div className="tb-right">
                {isDemo && <span className="demo-badge">Demo data</span>}
                <a className="round-btn dim" href="#/settings" aria-label="Settings" title="Settings">
                    <Icon name="settings" size={18} />
                </a>
            </div>
        </div>
    );
}
