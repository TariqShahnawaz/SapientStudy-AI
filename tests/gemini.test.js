import { describe, expect, it, vi } from 'vitest';
import { GeminiApiError, mapGeminiStatus, requestGemini } from '../gemini.js';

describe('Gemini error mapping', () => {
    it.each([
        [400, 'invalid_key'],
        [403, 'invalid_key'],
        [429, 'rate_limit'],
        [500, 'server']
    ])('maps HTTP %i to %s', (status, type) => {
        expect(mapGeminiStatus(status)).toMatchObject({ type });
    });

    it('maps other HTTP failures to request errors', () => {
        expect(mapGeminiStatus(404)).toMatchObject({ type: 'request', retryable: false });
    });
});

describe('Gemini request handling', () => {
    const options = { apiKey: 'fake-key', model: 'gemini-test', prompt: 'prompt', timeoutMs: 100 };

    it('sends the key in a request header and returns generated text', async () => {
        const fetchImpl = vi.fn().mockResolvedValue({
            ok: true,
            json: async () => ({ candidates: [{ content: { parts: [{ text: 'response' }] } }] })
        });
        await expect(requestGemini({ ...options, fetchImpl })).resolves.toBe('response');
        expect(fetchImpl.mock.calls[0][1].headers['x-goog-api-key']).toBe('fake-key');
        expect(fetchImpl.mock.calls[0][0]).not.toContain('?key=');
    });

    it('reports HTTP errors and network/offline/timeout failures', async () => {
        const response = status => ({ ok: false, status });
        await expect(requestGemini({ ...options, fetchImpl: vi.fn().mockResolvedValue(response(429)) }))
            .rejects.toMatchObject({ type: 'rate_limit' });
        await expect(requestGemini({ ...options, fetchImpl: vi.fn().mockRejectedValue(new Error('failed')), online: false }))
            .rejects.toMatchObject({ type: 'offline' });
        await expect(requestGemini({ ...options, fetchImpl: vi.fn().mockRejectedValue(new Error('failed')), online: true }))
            .rejects.toMatchObject({ type: 'network' });
        await expect(requestGemini({
            ...options,
            fetchImpl: vi.fn().mockImplementation((url, init) => new Promise((resolve, reject) => {
                init.signal.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')));
            }))
        })).rejects.toMatchObject({ type: 'timeout' });
    });

    it('reports malformed, empty and safety-blocked responses', async () => {
        const responseFor = body => ({ ok: true, json: async () => body });
        await expect(requestGemini({ ...options, fetchImpl: vi.fn().mockResolvedValue(responseFor(null)) }))
            .rejects.toBeInstanceOf(GeminiApiError);
        await expect(requestGemini({ ...options, fetchImpl: vi.fn().mockResolvedValue(responseFor({ candidates: [] })) }))
            .rejects.toMatchObject({ type: 'empty_response' });
        await expect(requestGemini({
            ...options,
            fetchImpl: vi.fn().mockResolvedValue(responseFor({ candidates: [{ finishReason: 'SAFETY' }] }))
        })).rejects.toMatchObject({ type: 'blocked', retryable: false });
    });
});
