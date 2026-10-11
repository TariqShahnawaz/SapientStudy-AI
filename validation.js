export const MIN_INPUT_LENGTH = 10;
export const MAX_INPUT_LENGTH = 8000;

export function validateInput(input) {
    if (!input) return 'Please enter some content first.';
    if (input.length < MIN_INPUT_LENGTH) {
        return `Please enter at least ${MIN_INPUT_LENGTH} characters so the AI has enough to work with.`;
    }
    if (input.length > MAX_INPUT_LENGTH) {
        return `Please keep your input to no more than ${MAX_INPUT_LENGTH} characters.`;
    }
    return null;
}

export function countInputCharacters(input) {
    return input.trim().length;
}
