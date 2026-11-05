import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { closeMenu, useMenu, type MenuItem } from '../state/menu';
import { Icon } from './Icon';

export function ContextMenu() {
    const menu = useMenu();
    const ref = useRef<HTMLDivElement>(null);
    const [pos, setPos] = useState({ x: 0, y: 0 });

    useLayoutEffect(() => {
        if (!menu || !ref.current) return;
        const r = ref.current.getBoundingClientRect();
        setPos({
            x: Math.max(8, Math.min(menu.x, innerWidth - r.width - 8)),
            y: Math.max(8, Math.min(menu.y, innerHeight - r.height - 8)),
        });
    }, [menu]);

    useEffect(() => {
        if (!menu) return;
        const close = (e: Event) => {
            if (e.type === 'keydown' && (e as KeyboardEvent).key !== 'Escape') return;
            if (e.type === 'pointerdown' && ref.current?.contains(e.target as Node)) return;
            closeMenu();
        };
        addEventListener('pointerdown', close, true);
        addEventListener('keydown', close);
        addEventListener('resize', close);
        addEventListener('wheel', close, { passive: true });
        return () => {
            removeEventListener('pointerdown', close, true);
            removeEventListener('keydown', close);
            removeEventListener('resize', close);
            removeEventListener('wheel', close);
        };
    }, [menu]);

    if (!menu) return null;
    return (
        <div className="ctx-backdrop">
            <div className="ctx" ref={ref} style={{ left: pos.x, top: pos.y }} role="menu">
                <Items items={menu.items} />
            </div>
        </div>
    );
}

function Items({ items }: { items: MenuItem[] }) {
    const [open, setOpen] = useState<number | null>(null);
    return (
        <>
            {items.map((item, i) =>
                item.separator ? (
                    <hr key={i} />
                ) : (
                    <div key={i} className="ctx-item-wrap" onMouseEnter={() => setOpen(item.submenu ? i : null)}>
                        <button
                            role="menuitem"
                            className={`ctx-item ${item.danger ? 'danger' : ''}`}
                            onClick={() => {
                                if (item.submenu) return setOpen(open === i ? null : i);
                                closeMenu();
                                item.onSelect?.();
                            }}
                        >
                            <span>{item.label}</span>
                            {item.submenu && <Icon name="chevronRight" size={16} />}
                        </button>
                        {item.submenu && open === i && (
                            <div className="ctx sub" role="menu">
                                <Items items={item.submenu} />
                            </div>
                        )}
                    </div>
                )
            )}
        </>
    );
}
