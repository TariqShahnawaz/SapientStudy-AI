import { describe, expect, it } from 'vitest';
import { buildPrompt, buildQuizPrompt } from '../prompts.js';

describe('prompt builders', () => {
    it('builds a prompt for every study tool and attaches source text', () => {
        const input = 'Sample source content.';
        for (const tool of ['summarizer', 'explainer', 'quiz', 'improver', 'scheduler', 'flashcards']) {
            expect(buildPrompt(tool, input)).toContain(input);
        }
        expect(buildPrompt('explainer', input, { explanationLevel: 'an advanced student' })).toContain('an advanced student');
    });

    it.each([
        ['easy', 'direct recall'],
        ['medium', 'apply concepts'],
        ['hard', 'synthesize multiple ideas']
    ])('builds %s difficulty quiz instructions', (difficulty, wording) => {
        expect(buildQuizPrompt(difficulty, 5)).toContain(wording);
        expect(buildQuizPrompt(difficulty, 5)).toContain('exactly 5');
    });

    it('rejects unsupported quiz settings and feature names', () => {
        expect(() => buildQuizPrompt('extreme', 3)).toThrow(RangeError);
        expect(() => buildQuizPrompt('easy', 4)).toThrow(RangeError);
        expect(() => buildPrompt('missing', 'text')).toThrow(RangeError);
    });
});
