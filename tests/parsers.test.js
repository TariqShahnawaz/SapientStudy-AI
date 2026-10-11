import { describe, expect, it } from 'vitest';
import { parseFlashcards, parseQuiz, stripCodeFences } from '../parsers.js';

const quizItem = {
    topic: 'Linear regression',
    question: 'What does the slope represent?',
    options: { A: 'Change in y per x', B: 'The intercept', C: 'The sample size', D: 'The residual' },
    correctAnswer: 'A',
    explanation: 'The slope measures the expected change in y for a one-unit increase in x.'
};

describe('AI JSON parsers', () => {
    it('parses normal and fenced quiz/flashcard JSON', () => {
        expect(parseQuiz(JSON.stringify([quizItem]))).toEqual([quizItem]);
        expect(parseQuiz(`\`\`\`json\n${JSON.stringify([quizItem])}\n\`\`\``)).toEqual([quizItem]);
        expect(parseFlashcards('[{"q":"Question","a":"Answer"}]')).toEqual([{ q: 'Question', a: 'Answer' }]);
        expect(stripCodeFences('```JSON\n[]\n```')).toBe('[]');
    });

    it('rejects malformed JSON and invalid shapes with safe errors', () => {
        expect(() => parseQuiz('not json')).toThrow(/invalid quiz/i);
        expect(() => parseQuiz('[{"topic":"x"}]')).toThrow(/invalid quiz/i);
        expect(() => parseFlashcards('not json')).toThrow(/invalid flashcards/i);
        expect(() => parseFlashcards('[{"q":"question","a":""}]')).toThrow(/invalid flashcards/i);
    });
});
