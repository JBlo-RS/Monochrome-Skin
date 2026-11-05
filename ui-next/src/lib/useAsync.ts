import { useEffect, useState } from 'react';

export function useAsync<T>(fn: (signal: AbortSignal) => Promise<T>, deps: unknown[]) {
    const [state, setState] = useState<{ data?: T; error?: Error; loading: boolean }>({ loading: true });
    useEffect(() => {
        const ctrl = new AbortController();
        setState({ loading: true });
        fn(ctrl.signal).then(
            (data) => !ctrl.signal.aborted && setState({ data, loading: false }),
            (error) => !ctrl.signal.aborted && setState({ error, loading: false })
        );
        return () => ctrl.abort();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, deps);
    return state;
}
