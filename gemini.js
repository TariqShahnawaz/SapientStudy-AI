export class GeminiApiError extends Error {
    constructor(type, message, retryable = true) {
        super(message);
        this.name = 'GeminiApiError';
        this.type = type;
        this.retryable = retryable;
    }
}

export function mapGeminiStatus(status) {
    if (status === 400 || status === 403) {
        return new GeminiApiError('invalid_key', 'Gemini rejected the request. Check your API key and model in Settings.', false);
    }
    if (status === 429) {
        return new GeminiApiError('rate_limit', 'Gemini is receiving too many requests. Wait a moment, then retry.');
    }
    if (status >= 500) {
        return new GeminiApiError('server', 'Gemini is temporarily unavailable. Retry in a moment.');
    }
    return new GeminiApiError(
        'request',
        `Gemini could not process the request (HTTP ${status}). Check your input and retry.`,
        false
    );
}

export async function requestGemini({
    apiKey,
    model,
    prompt,
    fetchImpl = globalThis.fetch,
    online = typeof navigator === 'undefined' ? true : navigator.onLine,
    timeoutMs = 30000
}) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    let response;
    try {
        response = await fetchImpl(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
            body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
            signal: controller.signal
        });
    } catch (error) {
        if (error.name === 'AbortError') {
            throw new GeminiApiError('timeout', `The request timed out after ${Math.round(timeoutMs / 1000)} seconds. Retry when ready.`);
        }
        if (!online) {
            throw new GeminiApiError('offline', 'You appear to be offline. Reconnect to the internet, then retry.');
        }
        throw new GeminiApiError('network', 'Could not reach Gemini. Check your connection, then retry.');
    } finally {
        clearTimeout(timeoutId);
    }

    if (!response.ok) throw mapGeminiStatus(response.status);

    let data;
    try {
        data = await response.json();
    } catch {
        throw new GeminiApiError('empty_response', 'Gemini returned an unreadable response. Retry.');
    }
    const candidate = data?.candidates?.[0];
    const text = candidate?.content?.parts?.map(part => part.text || '').join('').trim();
    if (text) return text;
    if (candidate?.finishReason === 'SAFETY') {
        throw new GeminiApiError('blocked', 'Gemini blocked this response for safety reasons. Rephrase your input and retry.', false);
    }
    throw new GeminiApiError('empty_response', 'Gemini returned no usable text. Retry with different input.');
}
