import { useToasts } from '../state/toast';

export function Toasts() {
    const toasts = useToasts();
    return (
        <div className="toasts" role="status" aria-live="polite">
            {toasts.map((t) => (
                <div className="toast" key={t.id}>
                    {t.text}
                </div>
            ))}
        </div>
    );
}
