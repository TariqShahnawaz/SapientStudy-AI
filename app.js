import { requestGemini, GeminiApiError } from './gemini.js';
import { parseFlashcards, parseQuiz } from './parsers.js';
import { buildPrompt } from './prompts.js';
import { HistoryStore } from './history.js';
import { MAX_INPUT_LENGTH, validateInput } from './validation.js';
import { createFlashcard, createToast, renderError, setTheme, updateCharacterCounter } from './ui.js';

const DOM = {
    apiKeyModal: document.getElementById('apiKeyModal'),
    historyModal: document.getElementById('historyModal'),
    settingsOverlay: document.getElementById('settingsOverlay'),

    apiKeyInput: document.getElementById('apiKeyInput'),
    apiKeyError: document.getElementById('apiKeyError'),
    closeApiKeyBtn: document.getElementById('closeApiKeyBtn'),
    saveApiKeyBtn: document.getElementById('saveApiKeyBtn'),
    changeKeyBtn: document.getElementById('changeKeyBtn'),
    viewHistoryBtn: document.getElementById('viewHistoryBtn'),
    closeHistoryBtn: document.getElementById('closeHistoryBtn'),
    clearHistoryBtn: document.getElementById('clearHistoryBtn'),
    clearHistoryFromSettingsBtn: document.getElementById('clearHistoryFromSettingsBtn'),
    openSettingsBtn: document.getElementById('openSettingsBtn'),
    closeSettingsBtn: document.getElementById('closeSettingsBtn'),
    installAppBtn: document.getElementById('installAppBtn'),
    generateBtn: document.getElementById('generateBtn'),
    retryBtn: document.getElementById('retryBtn'),
    regenerateBtn: document.getElementById('regenerateBtn'),
    copyBtn: document.getElementById('copyBtn'),
    exportBtn: document.getElementById('exportBtn'),
    exportMenu: document.getElementById('exportMenu'),

    navItems: document.querySelectorAll('.sidebar-nav .nav-item'),
    mobileNavItems: document.querySelectorAll('.mobile-nav-item[data-feature]'),
    mobileMoreBtn: document.getElementById('mobileMoreBtn'),
    featureTitle: document.getElementById('featureTitle'),
    featureDescription: document.getElementById('featureDescription'),
    userInput: document.getElementById('userInput'),
    documentInput: document.getElementById('documentInput'),
    uploadDocumentBtn: document.getElementById('uploadDocumentBtn'),
    documentStatus: document.getElementById('documentStatus'),
    charCount: document.getElementById('charCount'),
    errorMessage: document.getElementById('errorMessage'),
    difficultyRow: document.getElementById('difficultyRow'),
    quizOptions: document.getElementById('quizOptions'),
    quizDifficulty: document.getElementById('quizDifficulty'),
    quizQuestionCount: document.getElementById('quizQuestionCount'),
    showAnswersBtn: document.getElementById('showAnswersBtn'),

    outputContainer: document.getElementById('outputContainer'),
    flashcardContainer: document.getElementById('flashcardContainer'),
    loadingIndicator: document.getElementById('loadingIndicator'),
    historyList: document.getElementById('historyList'),
    historySearchInput: document.getElementById('historySearchInput'),
    toastContainer: document.getElementById('toastContainer'),

    themeToggle: document.getElementById('themeToggle'),
    modelSelect: document.getElementById('modelSelect'),
    customModelInput: document.getElementById('customModelInput'),
};

const MAX_FILE_SIZE = 20 * 1024 * 1024;

const FEATURES = {
    summarizer: {
        title: "Note Summarizer",
        desc: "Condense your long study notes into key bullet points.",
        placeholder: "Paste your notes here...",
    },
    explainer: {
        title: "Concept Explainer",
        desc: "Explain complex topics in simple terms with an example.",
        placeholder: "What concept are you struggling with? (e.g., Quantum Entanglement)",
        hasDifficulty: true
    },
    quiz: {
        title: "Quiz Generator",
        desc: "Create topic-labelled quizzes with adjustable difficulty and answer explanations.",
        placeholder: "Paste the text you want to be quizzed on...",
        isQuiz: true
    },
    improver: {
        title: "Answer Improver",
        desc: "Paste your draft answer and get actionable feedback to improve it.",
        placeholder: "Paste your draft answer here (and the question if you want)...",
    },
    scheduler: {
        title: "Schedule Maker",
        desc: "Generate a structured study timetable from a list of topics.",
        placeholder: "e.g., I have 3 days to study: Calculus limits, derivatives, and integrals...",
    },
    flashcards: {
        title: "Flashcard Maker",
        desc: "Turn your notes into flip-style question and answer flashcards.",
        placeholder: "Paste the notes you want turned into flashcards...",
        isFlashcards: true
    }
};

let currentFeature = 'summarizer';
let currentDifficulty = "A curious 10-year-old (ELI5)";
let apiKey = localStorage.getItem('gemini_api_key');
let selectedModel = localStorage.getItem('study_ai_model') || 'gemini-3.6-flash';
const historyStore = new HistoryStore(localStorage);
let currentOutputRaw = '';
let lastInputUsed = '';
let deferredInstallPrompt = null;
let lastGenerationInput = '';
let activeDialog = null;
let dialogReturnFocus = null;
const libraryLoads = new Map();

function init() {
    applyTheme(localStorage.getItem('study_ai_theme') || 'light');
    applyModelSetting();
    setupEventListeners();
    try {
        historyStore.load();
    } catch (error) {
        showToast(error.message, 'error');
    }
    renderHistory();
    setupInteractiveBackground();
    updateCharCount();
    setupPwa();
    if (!apiKey) openDialog(DOM.apiKeyModal);
}

function setupPwa() {
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('./service-worker.js')
            .catch(error => console.error('Service worker registration failed:', error));
    }

    window.addEventListener('beforeinstallprompt', (event) => {
        event.preventDefault();
        deferredInstallPrompt = event;
        DOM.installAppBtn.classList.remove('hidden');
    });

    window.addEventListener('appinstalled', () => {
        deferredInstallPrompt = null;
        DOM.installAppBtn.classList.add('hidden');
        showToast('SapientStudy-AI installed', 'success');
    });
}

function setupInteractiveBackground() {
    const blobs = document.querySelectorAll('.blob');
    if (blobs.length === 0) return;
    document.addEventListener('mousemove', (e) => {
        const x = e.clientX / window.innerWidth;
        const y = e.clientY / window.innerHeight;
        blobs[0].style.transform = `translate(${x * 30}px, ${y * 30}px) scale(1.1)`;
        if (blobs[1]) blobs[1].style.transform = `translate(${x * -40}px, ${y * -20}px) scale(1.05)`;
        if (blobs[2]) blobs[2].style.transform = `translate(${x * 20}px, ${y * -40}px) scale(1.1)`;
    });
}

function setupEventListeners() {
    DOM.saveApiKeyBtn.addEventListener('click', saveApiKey);
    DOM.closeApiKeyBtn.addEventListener('click', () => closeDialog(DOM.apiKeyModal));
    DOM.changeKeyBtn.addEventListener('click', () => {
        DOM.apiKeyInput.value = apiKey || '';
        closeDialog(DOM.settingsOverlay);
        openDialog(DOM.apiKeyModal, DOM.openSettingsBtn);
    });
    DOM.viewHistoryBtn.addEventListener('click', () => openDialog(DOM.historyModal, DOM.viewHistoryBtn));
    DOM.closeHistoryBtn.addEventListener('click', () => closeDialog(DOM.historyModal));
    DOM.clearHistoryBtn.addEventListener('click', clearHistory);
    DOM.clearHistoryFromSettingsBtn.addEventListener('click', clearHistory);
    DOM.historySearchInput.addEventListener('input', () => renderHistory(DOM.historySearchInput.value));

    DOM.openSettingsBtn.addEventListener('click', () => openDialog(DOM.settingsOverlay, DOM.openSettingsBtn));
    DOM.closeSettingsBtn.addEventListener('click', () => closeDialog(DOM.settingsOverlay));
    [DOM.apiKeyModal, DOM.historyModal, DOM.settingsOverlay].forEach(overlay => {
        overlay.addEventListener('click', (event) => {
            if (event.target === overlay) closeDialog(overlay);
        });
    });
    document.addEventListener('keydown', handleDialogKeydown);
    DOM.installAppBtn.addEventListener('click', installApp);

    DOM.themeToggle.addEventListener('change', () => applyTheme(DOM.themeToggle.checked ? 'dark' : 'light'));
    DOM.modelSelect.addEventListener('change', handleModelChange);
    DOM.customModelInput.addEventListener('change', () => {
        selectedModel = DOM.customModelInput.value.trim() || 'gemini-3.6-flash';
        localStorage.setItem('study_ai_model', selectedModel);
    });

    DOM.generateBtn.addEventListener('click', () => handleGenerate());
    DOM.quizDifficulty.addEventListener('change', () => {
        if (lastInputUsed && currentFeature === 'quiz') {
            lastInputUsed = DOM.userInput.value.trim();
        }
    });
    DOM.showAnswersBtn.addEventListener('click', toggleQuizAnswers);
    DOM.retryBtn.addEventListener('click', () => {
        if (lastGenerationInput) handleGenerate(lastGenerationInput);
    });
    DOM.regenerateBtn.addEventListener('click', () => {
        if (lastInputUsed) { DOM.userInput.value = lastInputUsed; handleGenerate(); }
    });
    DOM.copyBtn.addEventListener('click', copyToClipboard);
    DOM.exportBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const expanded = DOM.exportBtn.getAttribute('aria-expanded') === 'true';
        DOM.exportBtn.setAttribute('aria-expanded', String(!expanded));
        DOM.exportMenu.classList.toggle('hidden', expanded);
    });
    document.addEventListener('click', closeExportMenu);
    DOM.exportMenu.querySelectorAll('button').forEach(btn => {
        btn.addEventListener('click', () => exportOutput(btn.getAttribute('data-format')));
    });

    DOM.userInput.addEventListener('input', updateCharCount);
    DOM.uploadDocumentBtn.addEventListener('click', () => DOM.documentInput.click());
    DOM.documentInput.addEventListener('change', handleDocumentUpload);
    DOM.userInput.addEventListener('keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') { e.preventDefault(); handleGenerate(); }
    });

    DOM.navItems.forEach(item => {
        item.addEventListener('click', () => {
            const feature = item.getAttribute('data-feature');
            if (feature) switchFeature(feature);
        });
    });
    DOM.mobileNavItems.forEach(item => {
        item.addEventListener('click', () => {
            const feature = item.getAttribute('data-feature');
            if (feature) switchFeature(feature);
        });
    });
    DOM.mobileMoreBtn.addEventListener('click', () => openDialog(DOM.settingsOverlay, DOM.mobileMoreBtn));

    document.querySelectorAll('.chip').forEach(chip => {
        chip.addEventListener('click', () => {
            document.querySelectorAll('.chip').forEach(c => {
                c.classList.remove('active');
                c.setAttribute('aria-pressed', 'false');
            });
            chip.classList.add('active');
            chip.setAttribute('aria-pressed', 'true');
            currentDifficulty = chip.getAttribute('data-level');
        });
    });
}

function closeExportMenu() {
    DOM.exportMenu.classList.add('hidden');
    DOM.exportBtn.setAttribute('aria-expanded', 'false');
}

function openDialog(overlay, trigger = document.activeElement) {
    if (activeDialog && activeDialog !== overlay) closeDialog(activeDialog, false);
    activeDialog = overlay;
    dialogReturnFocus = trigger;
    overlay.classList.add('active');
    const dialog = overlay.querySelector('[role="dialog"]');
    const initialFocus = dialog.querySelector('input:not([type="hidden"]), select, textarea') ||
        dialog.querySelector('button:not(:disabled)');
    (initialFocus || dialog).focus();
}

function closeDialog(overlay = activeDialog, restoreFocus = true) {
    if (!overlay) return;
    overlay.classList.remove('active');
    if (activeDialog === overlay) activeDialog = null;
    const focusTarget = dialogReturnFocus === document.body
        ? document.getElementById('mainContent')
        : dialogReturnFocus;
    if (restoreFocus && focusTarget instanceof HTMLElement && focusTarget.isConnected) {
        focusTarget.focus();
    }
    dialogReturnFocus = null;
}

function handleDialogKeydown(event) {
    if (!activeDialog) return;
    if (event.key === 'Escape') {
        closeDialog();
        return;
    }
    if (event.key !== 'Tab') return;
    const dialog = activeDialog.querySelector('[role="dialog"]');
    const focusable = Array.from(dialog.querySelectorAll(
        'a[href], button:not(:disabled), input:not(:disabled):not([type="hidden"]), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex="-1"])'
    )).filter(element => element.getClientRects().length > 0);
    if (focusable.length === 0) {
        event.preventDefault();
        dialog.focus();
        return;
    }
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && (document.activeElement === first || !dialog.contains(document.activeElement))) {
        event.preventDefault();
        last.focus();
    } else if (!event.shiftKey && (document.activeElement === last || !dialog.contains(document.activeElement))) {
        event.preventDefault();
        first.focus();
    }
}

async function installApp() {
    if (!deferredInstallPrompt) return;

    await deferredInstallPrompt.prompt();
    const choice = await deferredInstallPrompt.userChoice;
    deferredInstallPrompt = null;
    DOM.installAppBtn.classList.add('hidden');
    if (choice.outcome === 'accepted') showToast('Installing SapientStudy-AI...', 'success');
}

/* Theme */
function applyTheme(theme) {
    setTheme(document, DOM.themeToggle, theme, localStorage);
}

/* Model settings */
function applyModelSetting() {
    const knownValues = Array.from(DOM.modelSelect.options).map(o => o.value);
    if (knownValues.includes(selectedModel)) {
        DOM.modelSelect.value = selectedModel;
        DOM.customModelInput.classList.add('hidden');
    } else {
        DOM.modelSelect.value = 'custom';
        DOM.customModelInput.value = selectedModel;
        DOM.customModelInput.classList.remove('hidden');
    }
}
function handleModelChange() {
    if (DOM.modelSelect.value === 'custom') {
        DOM.customModelInput.classList.remove('hidden');
        DOM.customModelInput.focus();
    } else {
        DOM.customModelInput.classList.add('hidden');
        selectedModel = DOM.modelSelect.value;
        localStorage.setItem('study_ai_model', selectedModel);
    }
}

/* Char count / validation feedback */
function updateCharCount() {
    updateCharacterCounter(DOM.userInput, DOM.charCount);
}

function loadBrowserLibrary(url, globalName) {
    if (window[globalName]) return Promise.resolve(window[globalName]);
    if (libraryLoads.has(globalName)) return libraryLoads.get(globalName);

    const load = new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = url;
        script.async = true;
        script.onload = () => {
            if (window[globalName]) resolve(window[globalName]);
            else {
                libraryLoads.delete(globalName);
                reject(new Error(`The ${globalName} document reader did not initialize.`));
            }
        };
        script.onerror = () => {
            script.remove();
            libraryLoads.delete(globalName);
            reject(new Error(`Could not load the ${globalName} document reader. Check your internet connection and retry.`));
        };
        document.head.appendChild(script);
    });
    libraryLoads.set(globalName, load);
    return load;
}

async function handleDocumentUpload() {
    const file = DOM.documentInput.files[0];
    DOM.documentInput.value = '';
    if (!file) return;

    const extension = file.name.split('.').pop().toLowerCase();
    if (!['pdf', 'docx', 'txt', 'md'].includes(extension)) {
        showError('Unsupported file type. Choose a PDF, DOCX, TXT, or MD file.');
        return;
    }
    if (file.size > MAX_FILE_SIZE) {
        showError('The document is larger than the 20 MB upload limit.');
        return;
    }

    clearError();
    DOM.uploadDocumentBtn.disabled = true;
    DOM.documentStatus.textContent = `Reading ${file.name}...`;

    try {
        const buffer = await file.arrayBuffer();
        let extractedText;

        if (extension === 'pdf') {
            const pdfjsLib = await loadBrowserLibrary(
                'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js',
                'pdfjsLib'
            );
            pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
            const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(buffer) });
            const pdf = await loadingTask.promise;
            const pages = [];
            for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber++) {
                const page = await pdf.getPage(pageNumber);
                const content = await page.getTextContent();
                pages.push(content.items.map(item => item.str || '').join(' '));
            }
            extractedText = pages.join('\n\n');
            await pdf.destroy();
        } else if (extension === 'docx') {
            const mammoth = await loadBrowserLibrary(
                'https://cdnjs.cloudflare.com/ajax/libs/mammoth/1.8.0/mammoth.browser.min.js',
                'mammoth'
            );
            const result = await mammoth.extractRawText({ arrayBuffer: buffer });
            extractedText = result.value;
        } else {
            extractedText = new TextDecoder('utf-8').decode(buffer);
        }

        extractedText = extractedText.trim();
        if (!extractedText) {
            throw new Error('No readable text was found. Scanned or image-only PDFs are not supported.');
        }

        const existingText = DOM.userInput.value.trim();
        const combinedText = existingText ? `${existingText}\n\n${extractedText}` : extractedText;
        if (combinedText.length > MAX_INPUT_LENGTH) {
            throw new Error(`The document text exceeds the ${MAX_INPUT_LENGTH}-character input limit. Use a shorter document.`);
        }

        DOM.userInput.value = combinedText;
        updateCharCount();
        DOM.documentStatus.textContent = `Added: ${file.name}`;
        DOM.userInput.focus();
    } catch (error) {
        console.error('Document upload failed:', error);
        showError(`Could not read "${file.name}": ${error.message || 'Please try another file.'}`);
        DOM.documentStatus.textContent = `Could not read: ${file.name}`;
    } finally {
        DOM.uploadDocumentBtn.disabled = false;
    }
}

/* API Key */
function saveApiKey() {
    const key = DOM.apiKeyInput.value.trim();
    if (!key) {
        DOM.apiKeyError.textContent = 'Enter a Gemini API key to continue.';
        DOM.apiKeyInput.focus();
        return;
    }
    apiKey = key;
    localStorage.setItem('gemini_api_key', apiKey);
    DOM.apiKeyError.textContent = '';
    const returnFocus = dialogReturnFocus;
    closeDialog(DOM.apiKeyModal, returnFocus !== document.body);
    if (returnFocus === document.body) DOM.userInput.focus();
    clearError();
    showToast('API key saved', 'success');
}

/* Feature switching */
function switchFeature(featureKey) {
    currentFeature = featureKey;
    const config = FEATURES[featureKey];

    document.querySelectorAll('[data-feature]').forEach(item => {
        const selected = item.getAttribute('data-feature') === featureKey;
        item.classList.toggle('active', selected);
        item.setAttribute('aria-pressed', String(selected));
    });

    DOM.featureTitle.textContent = config.title;
    DOM.featureDescription.textContent = config.desc;
    DOM.userInput.placeholder = config.placeholder;
    DOM.userInput.value = '';
    DOM.documentInput.value = '';
    DOM.documentStatus.textContent = 'PDF, DOCX, TXT, or MD (max 20 MB)';
    DOM.difficultyRow.classList.toggle('hidden', !config.hasDifficulty);
    DOM.quizOptions.classList.toggle('hidden', !config.isQuiz);
    DOM.showAnswersBtn.classList.add('hidden');
    DOM.showAnswersBtn.setAttribute('aria-expanded', 'false');
    DOM.showAnswersBtn.textContent = 'Show answers';

    updateCharCount();
    resetOutput();
    clearError();
}

function showError(msg, retryable = false) {
    renderError(DOM.errorMessage, DOM.retryBtn, msg, retryable, Boolean(lastGenerationInput));
}
function clearError() {
    renderError(DOM.errorMessage, DOM.retryBtn, '', false, false);
}

function showToast(message, type = 'error') {
    createToast(document, DOM.toastContainer, message, type);
}

function resetOutput() {
    DOM.outputContainer.classList.remove('hidden');
    DOM.flashcardContainer.classList.add('hidden');
    DOM.outputContainer.innerHTML = `
        <div class="empty-state">
            <i class='bx bx-ghost' aria-hidden="true"></i>
            <p>Output will appear here once generated.</p>
        </div>
    `;
    DOM.outputContainer.classList.add('empty');
    currentOutputRaw = '';
    DOM.showAnswersBtn.classList.add('hidden');
    DOM.showAnswersBtn.setAttribute('aria-expanded', 'false');
    DOM.showAnswersBtn.textContent = 'Show answers';
    DOM.copyBtn.disabled = true;
    DOM.exportBtn.disabled = true;
    closeExportMenu();
    DOM.regenerateBtn.disabled = true;
}

/* Core generation */
async function handleGenerate(inputOverride = null) {
    if (DOM.generateBtn.disabled) return;
    if (!apiKey) { openDialog(DOM.apiKeyModal, DOM.generateBtn); return; }

    const input = (inputOverride ?? DOM.userInput.value).trim();
    const validationMsg = validateInput(input);
    if (validationMsg) { showError(validationMsg, false); return; }

    clearError();
    lastInputUsed = input;
    lastGenerationInput = input;

    DOM.outputContainer.classList.add('hidden');
    DOM.flashcardContainer.classList.add('hidden');
    DOM.loadingIndicator.classList.remove('hidden');
    DOM.generateBtn.disabled = true;
    DOM.copyBtn.disabled = true;
    DOM.exportBtn.disabled = true;
    DOM.regenerateBtn.disabled = true;

    try {
        const config = FEATURES[currentFeature];
        const resultText = await callGeminiAPI(input);
        currentOutputRaw = resultText;

        DOM.loadingIndicator.classList.add('hidden');
        if (config.isQuiz) {
            const quiz = parseQuiz(resultText);
            renderQuiz(quiz);
        } else if (config.isFlashcards) {
            const cards = parseFlashcards(resultText);
            renderFlashcards(cards);
        } else {
            DOM.outputContainer.classList.remove('hidden');
            await renderMarkdownSafely(resultText);
        }
        saveToHistory(config.title, input, resultText);
        DOM.regenerateBtn.disabled = false;
        DOM.copyBtn.disabled = false;
        DOM.exportBtn.disabled = false;
    } catch (error) {
        console.error(error);
        showError(error.message || "Unable to generate a response right now. Please try again.", error.retryable !== false);
        resetOutput();
        DOM.loadingIndicator.classList.add('hidden');
    } finally {
        DOM.generateBtn.disabled = false;
    }
}

/* Safe markdown rendering (XSS-protected) */
async function renderMarkdownSafely(rawText) {
    let markdown;
    let sanitizer;
    try {
        [markdown, sanitizer] = await Promise.all([
            loadBrowserLibrary('https://cdn.jsdelivr.net/npm/marked/marked.min.js', 'marked'),
            loadBrowserLibrary('https://cdn.jsdelivr.net/npm/dompurify@3.0.9/dist/purify.min.js', 'DOMPurify')
        ]);
    } catch (error) {
        throw new GeminiApiError('render', error.message || 'Secure response rendering is unavailable. Check your connection and retry.');
    }
    const rawHtml = markdown.parse(rawText);
    const cleanHtml = sanitizer.sanitize(rawHtml);
    const content = document.createElement('template');
    content.innerHTML = cleanHtml;
    content.content.querySelectorAll('h1').forEach(heading => {
        const replacement = document.createElement('h2');
        replacement.innerHTML = heading.innerHTML;
        heading.replaceWith(replacement);
    });
    DOM.outputContainer.classList.remove('empty');
    DOM.outputContainer.replaceChildren(content.content.cloneNode(true));
    DOM.outputContainer.style.opacity = 0;
    requestAnimationFrame(() => { DOM.outputContainer.style.transition = 'opacity .3s ease'; DOM.outputContainer.style.opacity = 1; });
}

function renderQuiz(questions) {
    DOM.outputContainer.replaceChildren();
    questions.forEach((item, index) => {
        const article = document.createElement('article');
        article.className = 'quiz-question';
        const topic = document.createElement('p');
        topic.className = 'quiz-topic';
        topic.textContent = `Topic: ${item.topic}`;
        const title = document.createElement('h3');
        title.textContent = `${index + 1}. ${item.question}`;
        const options = document.createElement('ol');
        options.className = 'quiz-options-list';
        options.type = 'A';
        for (const key of ['A', 'B', 'C', 'D']) {
            const option = document.createElement('li');
            option.textContent = item.options[key];
            options.appendChild(option);
        }
        const answer = document.createElement('p');
        answer.className = 'quiz-answer hidden';
        answer.textContent = `Correct answer: ${item.correctAnswer}. ${item.options[item.correctAnswer]} — ${item.explanation}`;
        article.append(topic, title, options, answer);
        DOM.outputContainer.appendChild(article);
    });
    DOM.showAnswersBtn.classList.remove('hidden');
    DOM.showAnswersBtn.setAttribute('aria-expanded', 'false');
    DOM.showAnswersBtn.textContent = 'Show answers';
    DOM.outputContainer.classList.remove('hidden', 'empty');
}

function toggleQuizAnswers() {
    const expanded = DOM.showAnswersBtn.getAttribute('aria-expanded') === 'true';
    DOM.showAnswersBtn.setAttribute('aria-expanded', String(!expanded));
    DOM.showAnswersBtn.textContent = expanded ? 'Show answers' : 'Hide answers';
    DOM.outputContainer.querySelectorAll('.quiz-answer').forEach(answer => {
        answer.classList.toggle('hidden', expanded);
    });
}

function renderFlashcards(cards) {
    DOM.flashcardContainer.classList.remove('hidden');
    DOM.flashcardContainer.replaceChildren(...cards.map(card => createFlashcard(document, card)));

    DOM.copyBtn.disabled = false;
    DOM.exportBtn.disabled = false;
}

/* API call */
async function callGeminiAPI(userInput) {
    const prompt = buildPrompt(currentFeature, userInput, {
        explanationLevel: currentDifficulty,
        quizDifficulty: DOM.quizDifficulty.value,
        questionCount: DOM.quizQuestionCount.value
    });
    return requestGemini({
        apiKey,
        model: selectedModel || 'gemini-3.6-flash',
        prompt
    });
}

/* History */
function saveToHistory(type, input, output) {
    historyStore.add(type, input, output);
    renderHistory();
}

function renderHistory(filter = '') {
    const items = historyStore.search(filter);

    if (items.length === 0) {
        DOM.historyList.innerHTML = '<p class="history-empty">No history found.</p>';
        return;
    }

    DOM.historyList.innerHTML = items.map(item => `
        <article class="history-item">
            <div class="history-item-header">
                <button class="history-load-btn history-item-title" data-id="${item.id}">Open ${escapeHtml(item.type)}</button>
                <div style="display:flex; align-items:center; gap:8px;">
                    <span>${escapeHtml(item.date)}</span>
                    <button class="pin-btn ${item.pinned ? 'pinned' : ''}" data-pin-id="${item.id}" aria-label="${item.pinned ? 'Unpin' : 'Pin'} ${escapeHtml(item.type)}" aria-pressed="${item.pinned}"><i class='bx ${item.pinned ? 'bxs-star' : 'bx-star'}' aria-hidden="true"></i></button>
                </div>
            </div>
            <div class="history-item-preview">${escapeHtml(item.input.substring(0, 100))}...</div>
        </article>
    `).join('');

    document.querySelectorAll('.pin-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const id = parseInt(btn.getAttribute('data-pin-id'));
            const record = historyStore.togglePin(id);
            if (record) {
                renderHistory(DOM.historySearchInput.value);
            }
        });
    });

    document.querySelectorAll('.history-load-btn').forEach(button => {
        button.addEventListener('click', () => {
            const id = parseInt(button.getAttribute('data-id'));
            const record = historyStore.items.find(r => r.id === id);
            if (record) loadHistoryRecord(record);
        });
    });
}

function loadHistoryRecord(record) {
    closeDialog(DOM.historyModal);
    currentOutputRaw = record.output;
    lastInputUsed = record.input;

    const featureKey = Object.keys(FEATURES).find(k => FEATURES[k].title === record.type);
    if (featureKey) switchFeature(featureKey);

    DOM.userInput.value = record.input;
    updateCharCount();

    const config = FEATURES[featureKey] || {};
    if (config.isQuiz) {
        try {
            renderQuiz(parseQuiz(record.output));
        } catch (error) {
            showError(error.message || 'This saved quiz could not be loaded.');
        }
    } else if (config.isFlashcards) {
        renderFlashcards(record.output);
    } else {
        DOM.outputContainer.classList.remove('hidden');
        renderMarkdownSafely(record.output).catch(error => showError(error.message || 'This saved response could not be rendered safely.'));
        DOM.copyBtn.disabled = false;
        DOM.exportBtn.disabled = false;
    }
    DOM.regenerateBtn.disabled = false;
}

function clearHistory() {
    if (confirm("Are you sure you want to clear all history?")) {
        historyStore.clear();
        renderHistory();
        showToast('History cleared', 'success');
    }
}

function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

/* Utility actions */
function copyToClipboard() {
    if (!currentOutputRaw) return;
    navigator.clipboard.writeText(currentOutputRaw).then(() => {
        showToast('Copied to clipboard', 'success');
    }).catch(() => showToast('Could not copy to clipboard', 'error'));
}

function exportOutput(format) {
    if (!currentOutputRaw) return;
    DOM.exportMenu.classList.add('hidden');
    const ext = format === 'md' ? 'md' : 'txt';
    const mime = format === 'md' ? 'text/markdown' : 'text/plain';
    const blob = new Blob([currentOutputRaw], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `StudyAI_${FEATURES[currentFeature].title.replace(/\s+/g, '_')}_${Date.now()}.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
}

document.addEventListener('DOMContentLoaded', init);
