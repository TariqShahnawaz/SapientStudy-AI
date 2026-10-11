const DOM = {
    apiKeyModal: document.getElementById('apiKeyModal'),
    historyModal: document.getElementById('historyModal'),
    settingsOverlay: document.getElementById('settingsOverlay'),

    apiKeyInput: document.getElementById('apiKeyInput'),
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

const MIN_INPUT_LENGTH = 10;
const MAX_INPUT_LENGTH = 8000;
const MAX_FILE_SIZE = 20 * 1024 * 1024;

const FEATURES = {
    summarizer: {
        title: "Note Summarizer",
        desc: "Condense your long study notes into key bullet points.",
        placeholder: "Paste your notes here...",
        prompt: "You are an expert AI tutor. Summarize the following study notes concisely. Use bullet points and highlight the most critical information.\n\nNotes:\n"
    },
    explainer: {
        title: "Concept Explainer",
        desc: "Explain complex topics in simple terms with an example.",
        placeholder: "What concept are you struggling with? (e.g., Quantum Entanglement)",
        prompt: "You are an expert AI tutor. Explain the following concept clearly, as if explaining to {LEVEL}. Always include an easy-to-understand real-world example.\n\nConcept:\n",
        hasDifficulty: true
    },
    quiz: {
        title: "Quiz Generator",
        desc: "Generate short, multiple-choice quizzes based on your text.",
        placeholder: "Paste the text you want to be quizzed on...",
        prompt: "You are an expert AI tutor. Generate a short multiple-choice quiz (3 questions) based on the provided text. Provide the questions, options (A, B, C, D), and then provide the correct answers at the very end.\n\nText:\n"
    },
    improver: {
        title: "Answer Improver",
        desc: "Paste your draft answer and get actionable feedback to improve it.",
        placeholder: "Paste your draft answer here (and the question if you want)...",
        prompt: "You are an expert AI grader and tutor. Review the following draft answer provided by a student. First, provide constructive feedback on what is good and what is missing or incorrect. Then, provide a polished, improved version of the answer.\n\nStudent Answer:\n"
    },
    scheduler: {
        title: "Schedule Maker",
        desc: "Generate a structured study timetable from a list of topics.",
        placeholder: "e.g., I have 3 days to study: Calculus limits, derivatives, and integrals...",
        prompt: "You are an expert AI study coach. Create a structured, realistic study timetable based on the user's input below. Break it down day-by-day or hour-by-hour depending on the context provided.\n\nUser Constraints & Topics:\n"
    },
    flashcards: {
        title: "Flashcard Maker",
        desc: "Turn your notes into flip-style question and answer flashcards.",
        placeholder: "Paste the notes you want turned into flashcards...",
        prompt: "You are an expert AI tutor. Create exactly 6 flashcards based on the content below. Respond with ONLY a raw JSON array, no markdown formatting, no code fences, in this exact shape: [{\"q\":\"question text\",\"a\":\"answer text\"}]. Keep each question and answer short and clear.\n\nContent:\n",
        isFlashcards: true
    }
};

let currentFeature = 'summarizer';
let currentDifficulty = "A curious 10-year-old (ELI5)";
let apiKey = localStorage.getItem('gemini_api_key');
let selectedModel = localStorage.getItem('study_ai_model') || 'gemini-3.6-flash';
let generationHistory = JSON.parse(localStorage.getItem('study_ai_history') || '[]');
let currentOutputRaw = '';
let lastInputUsed = '';
let deferredInstallPrompt = null;
let lastGenerationInput = '';

class GeminiApiError extends Error {
    constructor(type, message, retryable = true) {
        super(message);
        this.name = 'GeminiApiError';
        this.type = type;
        this.retryable = retryable;
    }
}

function init() {
    applyTheme(localStorage.getItem('study_ai_theme') || 'light');
    applyModelSetting();
    if (!apiKey) DOM.apiKeyModal.classList.add('active');
    setupEventListeners();
    renderHistory();
    setupInteractiveBackground();
    updateCharCount();
    setupPwa();
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
    DOM.changeKeyBtn.addEventListener('click', () => {
        DOM.apiKeyInput.value = apiKey || '';
        DOM.settingsOverlay.classList.remove('active');
        DOM.apiKeyModal.classList.add('active');
    });
    DOM.viewHistoryBtn.addEventListener('click', () => DOM.historyModal.classList.add('active'));
    DOM.closeHistoryBtn.addEventListener('click', () => DOM.historyModal.classList.remove('active'));
    DOM.clearHistoryBtn.addEventListener('click', clearHistory);
    DOM.clearHistoryFromSettingsBtn.addEventListener('click', clearHistory);
    DOM.historySearchInput.addEventListener('input', () => renderHistory(DOM.historySearchInput.value));

    DOM.openSettingsBtn.addEventListener('click', () => DOM.settingsOverlay.classList.add('active'));
    DOM.closeSettingsBtn.addEventListener('click', () => DOM.settingsOverlay.classList.remove('active'));
    DOM.settingsOverlay.addEventListener('click', (e) => { if (e.target === DOM.settingsOverlay) DOM.settingsOverlay.classList.remove('active'); });
    DOM.installAppBtn.addEventListener('click', installApp);

    DOM.themeToggle.addEventListener('change', () => applyTheme(DOM.themeToggle.checked ? 'dark' : 'light'));
    DOM.modelSelect.addEventListener('change', handleModelChange);
    DOM.customModelInput.addEventListener('change', () => {
        selectedModel = DOM.customModelInput.value.trim() || 'gemini-3.6-flash';
        localStorage.setItem('study_ai_model', selectedModel);
    });

    DOM.generateBtn.addEventListener('click', handleGenerate);
    DOM.retryBtn.addEventListener('click', () => {
        if (lastGenerationInput) handleGenerate(lastGenerationInput);
    });
    DOM.regenerateBtn.addEventListener('click', () => {
        if (lastInputUsed) { DOM.userInput.value = lastInputUsed; handleGenerate(); }
    });
    DOM.copyBtn.addEventListener('click', copyToClipboard);
    DOM.exportBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        DOM.exportMenu.classList.toggle('hidden');
    });
    document.addEventListener('click', () => DOM.exportMenu.classList.add('hidden'));
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
    DOM.mobileMoreBtn.addEventListener('click', () => DOM.settingsOverlay.classList.add('active'));

    document.querySelectorAll('.chip').forEach(chip => {
        chip.addEventListener('click', () => {
            document.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
            chip.classList.add('active');
            currentDifficulty = chip.getAttribute('data-level');
        });
    });
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
    document.body.setAttribute('data-theme', theme);
    DOM.themeToggle.checked = theme === 'dark';
    localStorage.setItem('study_ai_theme', theme);
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
    const len = DOM.userInput.value.trim().length;
    DOM.charCount.textContent = `${len} / ${MAX_INPUT_LENGTH} characters`;
    DOM.charCount.classList.toggle('warn', len > 0 && len < MIN_INPUT_LENGTH);
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
            if (typeof pdfjsLib === 'undefined') {
                throw new Error('PDF reading is unavailable. Check your internet connection and reload the page.');
            }
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
            if (typeof mammoth === 'undefined') {
                throw new Error('Word document reading is unavailable. Check your internet connection and reload the page.');
            }
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
    if (key) {
        apiKey = key;
        localStorage.setItem('gemini_api_key', apiKey);
        DOM.apiKeyModal.classList.remove('active');
        clearError();
        showToast('API key saved', 'success');
    }
}

/* Feature switching */
function switchFeature(featureKey) {
    currentFeature = featureKey;
    const config = FEATURES[featureKey];

    document.querySelectorAll('[data-feature]').forEach(item => {
        item.classList.toggle('active', item.getAttribute('data-feature') === featureKey);
    });

    DOM.featureTitle.textContent = config.title;
    DOM.featureDescription.textContent = config.desc;
    DOM.userInput.placeholder = config.placeholder;
    DOM.userInput.value = '';
    DOM.documentInput.value = '';
    DOM.documentStatus.textContent = 'PDF, DOCX, TXT, or MD (max 20 MB)';
    DOM.difficultyRow.classList.toggle('hidden', !config.hasDifficulty);

    updateCharCount();
    resetOutput();
    clearError();
}

function showError(msg, retryable = false) {
    DOM.errorMessage.textContent = msg;
    DOM.retryBtn.classList.toggle('hidden', !retryable || !lastGenerationInput);
}
function clearError() {
    DOM.errorMessage.textContent = '';
    DOM.retryBtn.classList.add('hidden');
}

function showToast(message, type = 'error') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `<i class='bx ${type === 'success' ? 'bx-check-circle' : 'bx-error-circle'}'></i><span></span>`;
    toast.querySelector('span').textContent = message;
    DOM.toastContainer.appendChild(toast);
    setTimeout(() => toast.remove(), 4000);
}

function resetOutput() {
    DOM.outputContainer.classList.remove('hidden');
    DOM.flashcardContainer.classList.add('hidden');
    DOM.outputContainer.innerHTML = `
        <div class="empty-state">
            <i class='bx bx-ghost'></i>
            <p>Output will appear here once generated.</p>
        </div>
    `;
    DOM.outputContainer.classList.add('empty');
    currentOutputRaw = '';
    DOM.copyBtn.disabled = true;
    DOM.exportBtn.disabled = true;
    DOM.regenerateBtn.disabled = true;
}

/* Validation */
function validateInput(input) {
    if (!input) return "Please enter some content first.";
    if (input.length < MIN_INPUT_LENGTH) return `Please enter at least ${MIN_INPUT_LENGTH} characters so the AI has enough to work with.`;
    if (input.length > MAX_INPUT_LENGTH) return `Please keep your input under ${MAX_INPUT_LENGTH} characters.`;
    return null;
}

/* Core generation */
async function handleGenerate(inputOverride = null) {
    if (DOM.generateBtn.disabled) return;
    if (!apiKey) { DOM.apiKeyModal.classList.add('active'); return; }

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
        const resultText = await callGeminiAPI(input, config);
        currentOutputRaw = resultText;

        DOM.loadingIndicator.classList.add('hidden');
        if (config.isFlashcards) {
            const cards = parseFlashcards(resultText);
            renderFlashcards(cards);
        } else {
            DOM.outputContainer.classList.remove('hidden');
            renderMarkdownSafely(resultText);
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
function renderMarkdownSafely(rawText) {
    if (typeof marked === 'undefined' || typeof DOMPurify === 'undefined') {
        throw new GeminiApiError('render', 'Secure response rendering is unavailable. Check your connection and retry.');
    }
    const rawHtml = marked.parse(rawText);
    const cleanHtml = DOMPurify.sanitize(rawHtml);
    DOM.outputContainer.classList.remove('empty');
    DOM.outputContainer.innerHTML = cleanHtml;
    DOM.outputContainer.style.opacity = 0;
    requestAnimationFrame(() => { DOM.outputContainer.style.transition = 'opacity .3s ease'; DOM.outputContainer.style.opacity = 1; });
}

/* Flashcards rendering */
function parseFlashcards(rawText) {
    try {
        const cleaned = stripCodeFences(rawText);
        const cards = JSON.parse(cleaned);
        if (!Array.isArray(cards) || cards.length === 0 || cards.some(card =>
            !card || typeof card.q !== 'string' || !card.q.trim() ||
            typeof card.a !== 'string' || !card.a.trim()
        )) throw new Error('Flashcards must contain a question and answer.');
        return cards;
    } catch (e) {
        throw new GeminiApiError('invalid_output', "The AI returned invalid flashcards. Retry to generate them again.");
    }
}

function stripCodeFences(text) {
    return text.trim()
        .replace(/^```(?:json)?\s*/i, '')
        .replace(/\s*```$/, '')
        .trim();
}

function renderFlashcards(cards) {
    DOM.flashcardContainer.classList.remove('hidden');
    DOM.flashcardContainer.innerHTML = '';
    cards.forEach(card => {
        const el = document.createElement('div');
        el.className = 'flashcard';
        const q = document.createElement('div');
        const front = document.createElement('div');
        const inner = document.createElement('div');
        inner.className = 'flashcard-inner';
        const faceFront = document.createElement('div');
        faceFront.className = 'flashcard-face flashcard-front';
        faceFront.textContent = card.q || '';
        const faceBack = document.createElement('div');
        faceBack.className = 'flashcard-face flashcard-back';
        faceBack.textContent = card.a || '';
        inner.appendChild(faceFront);
        inner.appendChild(faceBack);
        el.appendChild(inner);
        el.addEventListener('click', () => el.classList.toggle('flipped'));
        DOM.flashcardContainer.appendChild(el);
    });

    DOM.copyBtn.disabled = false;
    DOM.exportBtn.disabled = false;
}

/* API call */
async function callGeminiAPI(userInput, config) {
    let promptTemplate = config.prompt;
    if (config.hasDifficulty) promptTemplate = promptTemplate.replace('{LEVEL}', currentDifficulty);
    const fullPrompt = `${promptTemplate}${userInput}`;

    const modelToUse = selectedModel || 'gemini-3.6-flash';
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(modelToUse)}:generateContent`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    let response;
    try {
        response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
            body: JSON.stringify({ contents: [{ parts: [{ text: fullPrompt }] }] }),
            signal: controller.signal
        });
    } catch (fetchError) {
        if (fetchError.name === 'AbortError') throw new GeminiApiError('timeout', 'The request timed out after 30 seconds. Retry when ready.');
        if (!navigator.onLine) throw new GeminiApiError('offline', 'You appear to be offline. Reconnect to the internet, then retry.');
        throw new GeminiApiError('network', 'Could not reach Gemini. Check your connection, then retry.');
    } finally {
        clearTimeout(timeoutId);
    }

    if (!response.ok) {
        if (response.status === 400 || response.status === 403) {
            throw new GeminiApiError('invalid_key', 'Gemini rejected the request. Check your API key and model in Settings.', false);
        }
        if (response.status === 429) throw new GeminiApiError('rate_limit', 'Gemini is receiving too many requests. Wait a moment, then retry.');
        if (response.status >= 500) throw new GeminiApiError('server', 'Gemini is temporarily unavailable. Retry in a moment.');
        throw new GeminiApiError('request', `Gemini could not process the request (HTTP ${response.status}). Check your input and retry.`, response.status >= 500);
    }

    let data;
    try {
        data = await response.json();
    } catch {
        throw new GeminiApiError('empty_response', 'Gemini returned an unreadable response. Retry.');
    }
    const candidate = data.candidates?.[0];
    const text = candidate?.content?.parts?.map(part => part.text || '').join('').trim();
    if (text) return text;
    if (candidate?.finishReason === 'SAFETY') {
        throw new GeminiApiError('blocked', 'Gemini blocked this response for safety reasons. Rephrase your input and retry.', false);
    }
    throw new GeminiApiError('empty_response', 'Gemini returned no usable text. Retry with different input.');
}

/* History */
function saveToHistory(type, input, output) {
    const item = { id: Date.now(), type, input, output, date: new Date().toLocaleString(), pinned: false };
    generationHistory.unshift(item);
    if (generationHistory.length > 50) generationHistory.pop();
    localStorage.setItem('study_ai_history', JSON.stringify(generationHistory));
    renderHistory();
}

function renderHistory(filter = '') {
    let items = [...generationHistory];
    if (filter.trim()) {
        const f = filter.trim().toLowerCase();
        items = items.filter(i => i.input.toLowerCase().includes(f) || i.type.toLowerCase().includes(f));
    }
    items.sort((a, b) => (b.pinned - a.pinned) || (b.id - a.id));

    if (items.length === 0) {
        DOM.historyList.innerHTML = `<p style="text-align:center; opacity:0.5; margin-top:20px;">No history found.</p>`;
        return;
    }

    DOM.historyList.innerHTML = items.map(item => `
        <div class="history-item" data-id="${item.id}">
            <div class="history-item-header">
                <span class="history-item-title">${escapeHtml(item.type)}</span>
                <div style="display:flex; align-items:center; gap:8px;">
                    <span>${escapeHtml(item.date)}</span>
                    <button class="pin-btn ${item.pinned ? 'pinned' : ''}" data-pin-id="${item.id}" title="Pin"><i class='bx ${item.pinned ? 'bxs-star' : 'bx-star'}'></i></button>
                </div>
            </div>
            <div class="history-item-preview">${escapeHtml(item.input.substring(0, 100))}...</div>
        </div>
    `).join('');

    document.querySelectorAll('.pin-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const id = parseInt(btn.getAttribute('data-pin-id'));
            const record = generationHistory.find(r => r.id === id);
            if (record) {
                record.pinned = !record.pinned;
                localStorage.setItem('study_ai_history', JSON.stringify(generationHistory));
                renderHistory(DOM.historySearchInput.value);
            }
        });
    });

    document.querySelectorAll('.history-item').forEach(el => {
        el.addEventListener('click', () => {
            const id = parseInt(el.getAttribute('data-id'));
            const record = generationHistory.find(r => r.id === id);
            if (record) loadHistoryRecord(record);
        });
    });
}

function loadHistoryRecord(record) {
    DOM.historyModal.classList.remove('active');
    currentOutputRaw = record.output;
    lastInputUsed = record.input;

    const featureKey = Object.keys(FEATURES).find(k => FEATURES[k].title === record.type);
    if (featureKey) switchFeature(featureKey);

    DOM.userInput.value = record.input;
    updateCharCount();

    const config = FEATURES[featureKey] || {};
    if (config.isFlashcards) {
        renderFlashcards(record.output);
    } else {
        DOM.outputContainer.classList.remove('hidden');
        renderMarkdownSafely(record.output);
        DOM.copyBtn.disabled = false;
        DOM.exportBtn.disabled = false;
    }
    DOM.regenerateBtn.disabled = false;
}

function clearHistory() {
    if (confirm("Are you sure you want to clear all history?")) {
        generationHistory = [];
        localStorage.removeItem('study_ai_history');
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
