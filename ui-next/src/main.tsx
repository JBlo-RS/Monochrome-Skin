import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import { source } from './lib/source';
import './styles.css';

const root = createRoot(document.getElementById('root')!);
source
    .init()
    .catch((err) => console.error('Music service failed to start', err))
    .finally(() =>
        root.render(
            <StrictMode>
                <App />
            </StrictMode>
        )
    );
