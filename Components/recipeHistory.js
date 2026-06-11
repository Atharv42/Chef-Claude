const STORAGE_KEY = 'chef-claude-recipes';
const MAX_ENTRIES = 5;

export function loadHistory() {
    try {
        return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    } catch {
        return [];
    }
}

export function saveRecipe(entry) {
    const existing = loadHistory();
    const updated = [entry, ...existing].slice(0, MAX_ENTRIES);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return updated;
}
