import { GeminiApiError } from './gemini.js';

export function stripCodeFences(text) {
    return text.trim()
        .replace(/^```(?:json)?\s*/i, '')
        .replace(/\s*```$/, '')
        .trim();
}

export function parseFlashcards(rawText) {
    try {
        const cards = JSON.parse(stripCodeFences(rawText));
        if (!Array.isArray(cards) || cards.length === 0 || cards.some(card =>
            !card || typeof card.q !== 'string' || !card.q.trim() ||
            typeof card.a !== 'string' || !card.a.trim()
        )) throw new Error('Flashcards must contain a question and answer.');
        return cards;
    } catch {
        throw new GeminiApiError('invalid_output', 'The AI returned invalid flashcards. Retry to generate them again.');
    }
}

export function parseQuiz(rawText) {
    try {
        const quiz = JSON.parse(stripCodeFences(rawText));
        if (!Array.isArray(quiz) || quiz.length === 0 || quiz.some(question =>
            !question ||
            typeof question.topic !== 'string' || !question.topic.trim() ||
            typeof question.question !== 'string' || !question.question.trim() ||
            !question.options || !['A', 'B', 'C', 'D'].every(option =>
                typeof question.options[option] === 'string' && question.options[option].trim()
            ) ||
            !['A', 'B', 'C', 'D'].includes(question.correctAnswer) ||
            typeof question.explanation !== 'string' || !question.explanation.trim()
        )) throw new Error('Invalid quiz item');
        return quiz;
    } catch {
        throw new GeminiApiError('invalid_output', 'The AI returned an invalid quiz. Retry to generate it again.');
    }
}
