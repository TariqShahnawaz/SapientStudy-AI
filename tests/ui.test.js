import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createFlashcard, createToast, renderError, setTheme, updateCharacterCounter } from '../ui.js';

describe('accessible DOM helpers', () => {
    beforeEach(() => {
        document.body.innerHTML = '<div id="toasts"></div><span id="counter"></span><button id="retry"></button>';
    });

    it('updates the live character counter and warning state', () => {
        const input = document.createElement('textarea');
        const counter = document.querySelector('#counter');
        input.value = '  short  ';
        expect(updateCharacterCounter(input, counter)).toBe(5);
        expect(counter.textContent).toBe('5 / 8000 characters');
        expect(counter.classList.contains('warn')).toBe(true);
    });

    it('renders safe error text and exposes Retry only when applicable', () => {
        const message = document.createElement('div');
        const retry = document.querySelector('#retry');
        renderError(message, retry, '<script>bad</script>', true, true);
        expect(message.textContent).toBe('<script>bad</script>');
        expect(retry.classList.contains('hidden')).toBe(false);
        renderError(message, retry, 'error', false, true);
        expect(retry.classList.contains('hidden')).toBe(true);
    });

    it('announces toast success and error status accessibly', () => {
        const container = document.querySelector('#toasts');
        const error = createToast(document, container, 'Could not save', 'error', 10000);
        const success = createToast(document, container, 'Saved', 'success', 10000);
        expect(error.getAttribute('role')).toBe('alert');
        expect(success.getAttribute('role')).toBe('status');
        expect(error.textContent).toContain('Could not save');
    });

    it('supports pointer and keyboard flashcard flipping and updates the theme', () => {
        const card = createFlashcard(document, { q: 'Question', a: 'Answer' });
        expect(card.getAttribute('tabindex')).toBe('0');
        card.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true }));
        expect(card.getAttribute('aria-pressed')).toBe('true');
        expect(card.getAttribute('aria-label')).toContain('Answer');
        card.click();
        expect(card.getAttribute('aria-pressed')).toBe('false');
        const toggle = document.createElement('input');
        toggle.type = 'checkbox';
        const storage = { setItem: vi.fn() };
        setTheme(document, toggle, 'dark', storage);
        expect(document.body.getAttribute('data-theme')).toBe('dark');
        expect(toggle.checked).toBe(true);
        expect(storage.setItem).toHaveBeenCalledWith('study_ai_theme', 'dark');
    });
});
