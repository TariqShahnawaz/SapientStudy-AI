import { describe, expect, it, vi } from 'vitest';
import { HistoryStore } from '../history.js';

function createStorage() {
    const data = new Map();
    return {
        getItem: key => data.get(key) ?? null,
        setItem: (key, value) => data.set(key, value),
        removeItem: key => data.delete(key)
    };
}

describe('history storage', () => {
    it('saves, searches, sorts and toggles pinned entries', () => {
        const storage = createStorage();
        const store = new HistoryStore(storage, 'history', vi.fn().mockReturnValueOnce(1).mockReturnValueOnce(2));
        store.add('Quiz', 'Regression notes', 'quiz output', 'today');
        store.add('Flashcards', 'Biology notes', 'cards output', 'yesterday');
        expect(store.search('regression').map(item => item.type)).toEqual(['Quiz']);
        store.togglePin(1);
        expect(store.search()[0].id).toBe(1);
        expect(JSON.parse(storage.getItem('history')).find(item => item.id === 1).pinned).toBe(true);
    });

    it('caps history at 50 entries and clears persisted records', () => {
        const store = new HistoryStore(createStorage(), 'history', (() => { let id = 0; return () => ++id; })());
        for (let i = 0; i < 52; i += 1) store.add('Tool', `input ${i}`, 'output');
        expect(store.items).toHaveLength(50);
        expect(store.items[0].input).toBe('input 51');
        store.clear();
        expect(store.items).toEqual([]);
    });

    it('reports corrupted saved records after clearing them', () => {
        const storage = createStorage();
        storage.setItem('history', '{broken');
        expect(() => new HistoryStore(storage, 'history').load()).toThrow(/unreadable/i);
        expect(storage.getItem('history')).toBeNull();
    });
});
