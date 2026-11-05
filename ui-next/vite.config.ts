import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import blobAssetPlugin from '../vite-plugin-blob';
import svgUse from '../vite-plugin-svg-use';

const root = path.resolve(__dirname, '..');

// The new UI lives in its own folder but reuses the existing music code in ../js.
export default defineConfig({
    root: __dirname,
    base: './',
    plugins: [react(), blobAssetPlugin(), svgUse()],
    define: {
        __COMMIT_HASH__: JSON.stringify('ui-next'),
        __VITEST__: false,
        'process.env.CI': JSON.stringify(''),
    },
    resolve: {
        alias: [
            { find: '@core', replacement: path.join(root, 'js') },
            { find: /^!lucide\//, replacement: path.join(root, 'node_modules/lucide-static/icons') + '/' },
            { find: /^!simpleicons\//, replacement: path.join(root, 'node_modules/simple-icons/icons') + '/' },
            { find: /^!\//, replacement: path.join(root, 'node_modules') + '/' },
            { find: /^events$/, replacement: path.join(root, 'node_modules/events/events.js') },
            { find: /^pocketbase$/, replacement: path.join(root, 'node_modules/pocketbase/dist/pocketbase.es.js') },
        ],
        dedupe: ['react', 'react-dom'],
    },
    optimizeDeps: {
        exclude: ['pocketbase', '@ffmpeg/ffmpeg', '@ffmpeg/util'],
    },
    worker: { format: 'es' },
    server: {
        port: 5180,
        fs: { allow: [root] },
    },
    build: {
        outDir: 'dist',
        chunkSizeWarningLimit: 800,
        emptyOutDir: true,
    },
});
