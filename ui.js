import { countInputCharacters, MAX_INPUT_LENGTH, MIN_INPUT_LENGTH } from './validation.js';

export function updateCharacterCounter(input, counter) {
    const length = countInputCharacters(input.value);
    counter.textContent = `${length} / ${MAX_INPUT_LENGTH} characters`;
    counter.classList.toggle('warn', length > 0 && length < MIN_INPUT_LENGTH);
    return length;
}

export function renderError(messageElement, retryButton, message, retryable = false, hasRetryInput = false) {
    messageElement.textContent = message;
    retryButton.classList.toggle('hidden', !retryable || !hasRetryInput);
}

export function createToast(documentRef, container, message, type = 'error', duration = 4000) {
    const toast = documentRef.createElement('div');
    toast.className = `toast ${type}`;
    toast.setAttribute('role', type === 'error' ? 'alert' : 'status');
    const icon = documentRef.createElement('i');
    icon.className = `bx ${type === 'success' ? 'bx-check-circle' : 'bx-error-circle'}`;
    icon.setAttribute('aria-hidden', 'true');
    const text = documentRef.createElement('span');
    text.textContent = message;
    toast.append(icon, text);
    container.appendChild(toast);
    setTimeout(() => toast.remove(), duration);
    return toast;
}

export function setTheme(documentRef, toggle, theme, storage) {
    documentRef.body.setAttribute('data-theme', theme);
    toggle.checked = theme === 'dark';
    storage.setItem('study_ai_theme', theme);
}

export function createFlashcard(documentRef, card) {
    const element = documentRef.createElement('div');
    element.className = 'flashcard';
    element.setAttribute('role', 'button');
    element.setAttribute('tabindex', '0');
    element.setAttribute('aria-pressed', 'false');
    element.setAttribute('aria-label', `Flashcard front: ${card.q}. Press Enter or Space to reveal the answer.`);

    const inner = documentRef.createElement('div');
    inner.className = 'flashcard-inner';
    const front = documentRef.createElement('div');
    front.className = 'flashcard-face flashcard-front';
    front.textContent = card.q;
    const back = documentRef.createElement('div');
    back.className = 'flashcard-face flashcard-back';
    back.textContent = card.a;
    front.setAttribute('aria-hidden', 'false');
    back.setAttribute('aria-hidden', 'true');
    inner.append(front, back);
    element.appendChild(inner);

    const flip = () => {
        const flipped = element.classList.toggle('flipped');
        element.setAttribute('aria-pressed', String(flipped));
        element.setAttribute('aria-label', flipped
            ? `Flashcard answer: ${card.a}. Press Enter or Space to show the question.`
            : `Flashcard front: ${card.q}. Press Enter or Space to reveal the answer.`);
        front.setAttribute('aria-hidden', String(flipped));
        back.setAttribute('aria-hidden', String(!flipped));
    };
    element.addEventListener('click', flip);
    element.addEventListener('keydown', event => {
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            flip();
        }
    });
    return element;
}
