import { Icon } from '../components/Icon';

export function Loading() {
    return (
        <div className="entity-page">
            <header className="page-header sk-header">
                <div className="ph-art sk" />
                <div className="ph-text">
                    <span className="sk sk-text" style={{ width: 80 }} />
                    <span className="sk sk-text" style={{ width: '60%', height: 48 }} />
                    <span className="sk sk-text" style={{ width: 220 }} />
                </div>
            </header>
            <div className="page-body">
                {Array.from({ length: 8 }, (_, i) => (
                    <div key={i} className="sk-row">
                        <span className="sk sk-text" style={{ width: 16 }} />
                        <span className="sk sk-cover" />
                        <span className="sk sk-text" style={{ width: `${30 + ((i * 17) % 30)}%` }} />
                    </div>
                ))}
            </div>
        </div>
    );
}

export function ErrorState({ what }: { what: string }) {
    return (
        <div className="empty-state">
            <Icon name="close" size={48} />
            <h2>Couldn't load this {what}</h2>
            <p>The music service didn't respond. Check your connection or try again in a moment.</p>
            <button className="btn-light" onClick={() => location.reload()}>
                Try again
            </button>
        </div>
    );
}
