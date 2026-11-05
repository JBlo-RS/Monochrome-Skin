import { useSyncExternalStore } from 'react';

export interface MenuItem {
    label: string;
    onSelect?: () => void;
    submenu?: MenuItem[];
    danger?: boolean;
    separator?: boolean;
}
export interface MenuState {
    x: number;
    y: number;
    items: MenuItem[];
}

let menu: MenuState | null = null;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

export function openMenu(e: { clientX: number; clientY: number; preventDefault?: () => void; stopPropagation?: () => void }, items: MenuItem[]) {
    e.preventDefault?.();
    e.stopPropagation?.();
    menu = { x: e.clientX, y: e.clientY, items };
    emit();
}
export function closeMenu() {
    if (!menu) return;
    menu = null;
    emit();
}
export function useMenu() {
    return useSyncExternalStore(
        (l) => {
            listeners.add(l);
            return () => listeners.delete(l);
        },
        () => menu
    );
}
