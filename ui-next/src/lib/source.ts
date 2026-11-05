import type { MusicSource } from './types';
import { DemoSource } from './demo-source';
import { LiveSource } from './live-source';

const params = new URLSearchParams(location.search);
if (params.has('demo')) localStorage.setItem('ui-next:demo', params.get('demo') === '0' ? '0' : '1');

export const isDemo = localStorage.getItem('ui-next:demo') === '1';
export const source: MusicSource = isDemo ? new DemoSource() : new LiveSource();

export function setDemo(on: boolean) {
    localStorage.setItem('ui-next:demo', on ? '1' : '0');
    location.href = location.pathname + location.hash;
}
