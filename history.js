const HISTORY_KEY = 'study_ai_history';
const HISTORY_LIMIT = 50;

function isHistoryEntry(item) {
    return item && Number.isFinite(item.id) &&
        typeof item.type === 'string' &&
        typeof item.input === 'string' &&
        typeof item.output === 'string' &&
        typeof item.date === 'string' &&
        typeof item.pinned === 'boolean';
}

export function searchHistory(items, filter = '') {
    const query = filter.trim().toLowerCase();
    const results = query
        ? items.filter(item => item.input.toLowerCase().includes(query) || item.type.toLowerCase().includes(query))
        : [...items];
    return results.sort((a, b) => Number(b.pinned) - Number(a.pinned) || b.id - a.id);
}

export class HistoryStore {
    constructor(storage, key = HISTORY_KEY, now = Date.now) {
        this.storage = storage;
        this.key = key;
        this.now = now;
        this.items = [];
    }

    load() {
        const stored = this.storage.getItem(this.key);
        if (stored === null) {
            this.items = [];
            return this.items;
        }
        try {
            const entries = JSON.parse(stored);
            if (!Array.isArray(entries) || !entries.every(isHistoryEntry)) {
                throw new TypeError('History does not match the expected format.');
            }
            this.items = entries;
            return this.items;
        } catch (error) {
            this.storage.removeItem(this.key);
            throw new Error('Saved history was unreadable and has been cleared.', { cause: error });
        }
    }

    add(type, input, output, date = new Date().toLocaleString()) {
        const item = { id: this.now(), type, input, output, date, pinned: false };
        this.items.unshift(item);
        this.items = this.items.slice(0, HISTORY_LIMIT);
        this.persist();
        return item;
    }

    search(filter = '') {
        return searchHistory(this.items, filter);
    }

    togglePin(id) {
        const record = this.items.find(item => item.id === id);
        if (!record) return null;
        record.pinned = !record.pinned;
        this.persist();
        return record;
    }

    clear() {
        this.items = [];
        this.storage.removeItem(this.key);
    }

    persist() {
        this.storage.setItem(this.key, JSON.stringify(this.items));
    }
}
