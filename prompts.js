const QUIZ_DIFFICULTIES = Object.freeze({
    easy: 'Easy: direct recall of facts explicitly stated in the source.',
    medium: 'Medium: apply concepts from the source to a new but familiar situation.',
    hard: 'Hard: synthesize multiple ideas and use critical analysis based on the source.'
});

const TOOL_INSTRUCTIONS = Object.freeze({
    summarizer: 'You are an expert AI tutor. Summarize the following study notes concisely. Use bullet points and highlight the most critical information.\n\nNotes:\n',
    explainer: (level) => `You are an expert AI tutor. Explain the following concept clearly, as if explaining to ${level}. Always include an easy-to-understand real-world example.\n\nConcept:\n`,
    improver: 'You are an expert AI grader and tutor. Review the following draft answer provided by a student. First, provide constructive feedback on what is good and what is missing or incorrect. Then, provide a polished, improved version of the answer.\n\nStudent Answer:\n',
    scheduler: 'You are an expert AI study coach. Create a structured, realistic study timetable based on the user\'s input below. Break it down day-by-day or hour-by-hour depending on the context provided.\n\nUser Constraints & Topics:\n',
    flashcards: 'You are an expert AI tutor. Create exactly 6 flashcards based on the content below. Respond with ONLY a raw JSON array, no markdown formatting, no code fences, in this exact shape: [{"q":"question text","a":"answer text"}]. Keep each question and answer short and clear.\n\nContent:\n'
});

export function buildQuizPrompt(difficulty = 'medium', questionCount = 3) {
    const difficultyDescription = QUIZ_DIFFICULTIES[difficulty];
    const count = Number(questionCount);
    if (!difficultyDescription) throw new RangeError(`Unsupported quiz difficulty: ${difficulty}`);
    if (![3, 5, 8, 10].includes(count)) throw new RangeError(`Unsupported quiz question count: ${questionCount}`);
    return `You are an expert assessment designer. Create exactly ${count} multiple-choice questions using only the source material below. Difficulty: ${difficultyDescription}\nFor each question, provide a short topic label, question, four options A-D, the correct option letter, and a concise explanation of why it is correct. Return ONLY a valid JSON array, with each item shaped exactly like {"topic":"...","question":"...","options":{"A":"...","B":"...","C":"...","D":"..."},"correctAnswer":"A","explanation":"..."}.\n\nSource material:\n`;
}

export function buildPrompt(feature, input, settings = {}) {
    if (feature === 'quiz') {
        return `${buildQuizPrompt(settings.quizDifficulty, settings.questionCount)}${input}`;
    }
    const instruction = TOOL_INSTRUCTIONS[feature];
    if (!instruction) throw new RangeError(`Unsupported study tool: ${feature}`);
    const prompt = typeof instruction === 'function'
        ? instruction(settings.explanationLevel || 'a first-year college student')
        : instruction;
    return `${prompt}${input}`;
}

export { QUIZ_DIFFICULTIES, TOOL_INSTRUCTIONS };
