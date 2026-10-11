import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        environment: 'jsdom',
        include: ['tests/**/*.test.js'],
        coverage: {
            provider: 'v8',
            include: ['validation.js', 'prompts.js', 'gemini.js', 'parsers.js', 'history.js', 'ui.js'],
            reporter: ['text', 'html'],
            thresholds: {
                statements: 70,
                branches: 50
            }
        }
    }
});
