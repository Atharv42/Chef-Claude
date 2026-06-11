import React from 'react';

function formatDate(timestamp) {
    return new Date(timestamp).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

export default function RecipeHistory({ history, onSelect }) {
    const [open, setOpen] = React.useState(false);

    if (history.length === 0) return null;

    return (
        <section className="history-section">
            <button
                className="history-toggle"
                onClick={() => setOpen(prev => !prev)}
                aria-expanded={open}
            >
                <span>Previous Recipes ({history.length})</span>
                <span className={`history-chevron${open ? ' history-chevron--open' : ''}`}>▾</span>
            </button>
            {open && (
                <ul className="history-list">
                    {history.map(entry => (
                        <li
                            key={entry.id}
                            className="history-item"
                            onClick={() => onSelect(entry)}
                            role="button"
                            tabIndex={0}
                            onKeyDown={e => e.key === 'Enter' && onSelect(entry)}
                        >
                            <div className="history-item-title">{entry.title}</div>
                            <div className="history-item-meta">
                                <span className="history-item-ingredients">
                                    {entry.ingredients.slice(0, 3).join(', ')}
                                    {entry.ingredients.length > 3 && ` +${entry.ingredients.length - 3} more`}
                                </span>
                                <span className="history-item-date">{formatDate(entry.timestamp)}</span>
                            </div>
                        </li>
                    ))}
                </ul>
            )}
        </section>
    );
}
