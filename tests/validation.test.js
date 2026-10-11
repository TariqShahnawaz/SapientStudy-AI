import { describe, expect, it } from 'vitest';
import { countInputCharacters, validateInput } from '../validation.js';

describe('input validation', () => {
    it('rejects empty and whitespace-only input', () => {
        expect(validateInput('')).toMatch(/enter some content/i);
        expect(validateInput('   ')).toMatch(/at least 10 characters/i);
    });

    it('requires at least ten trimmed characters', () => {
        expect(validateInput('123456789')).toMatch(/at least 10 characters/i);
        expect(validateInput('1234567890')).toBeNull();
    });

    it('accepts 8,000 and rejects 8,001 characters', () => {
        expect(validateInput('a'.repeat(8000))).toBeNull();
        expect(validateInput('a'.repeat(8001))).toMatch(/no more than 8000/i);
    });

    it('counts trimmed characters consistently with validation', () => {
        expect(countInputCharacters('  study notes  ')).toBe(11);
    });
});
