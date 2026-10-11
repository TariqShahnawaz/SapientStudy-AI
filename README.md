# SapientStudy-AI

**Live application:** [sapientstudy-ai.vercel.app](https://sapientstudy-ai.vercel.app/)

## Project brief

SapientStudy-AI helps students turn their own study notes, draft answers, and topic lists into useful learning materials instead of facing a generic chatbot. It is for learners who need quick summaries, explanations, quizzes, improved answers, schedules, or flashcards from material they already have. I chose this idea because study workflows benefit from focused AI assistance, clear output formats, and user control over the source material.

## Quick start for reviewers

Get a free Gemini API key at [Google AI Studio](https://aistudio.google.com/) (sign in, create an API key, and copy it; it typically takes about a minute). Open the deployed app, enter the key in Settings, and try a study tool. The key is stored in your browser's local storage and sent directly to Google; **do not share or commit a real key**.

### Run locally in under five minutes

The production app remains plain static HTML/CSS/JavaScript. No build or bundling step is required.

```bash
npm install
npm run serve
```

Open <http://127.0.0.1:4173>. To run the unit tests, use a second terminal:

```bash
npm test
npm run test:coverage
```

For browser tests and accessibility checks, install Chromium once and run:

```bash
npx playwright install chromium
npm run test:e2e
```

## Features

| Tool | Purpose |
| --- | --- |
| Note Summarizer | Condenses study notes into key points. |
| Concept Explainer | Explains concepts at a selected level with an example. |
| Quiz Generator | Generates 3, 5, 8, or 10 topic-labelled MCQs at Easy, Medium, or Hard difficulty with answer reasoning. |
| Answer Improver | Gives feedback on a draft and proposes a polished version. |
| Schedule Maker | Turns topics and time constraints into a study timetable. |
| Flashcard Maker | Makes six keyboard-operable question/answer cards. |

Text-based PDF, DOCX, TXT, and MD uploads are supported in every tool. Files are extracted in the browser and the resulting text can be reviewed before generation. Scanned/image-only PDFs are not supported. Other features include searchable/pinnable local history, light/dark themes, copy/export, and PWA installation.

## Architecture

The site is served directly from the repository root on Vercel; `package.json` contains development-only test/audit dependencies and scripts.

| File | Responsibility |
| --- | --- |
| `index.html`, `style.css` | Accessible semantic UI and responsive light/dark styling. |
| `app.js` | Connects UI events, local settings/history, uploads, response rendering, and feature navigation. |
| `validation.js` | Shared 10–8,000 character validation and counting. |
| `prompts.js` | Per-tool and quiz difficulty prompt builders. |
| `gemini.js` | Gemini request, timeout, HTTP mapping, and response failure handling. |
| `parsers.js` | Defensive quiz and flashcard JSON parsing. |
| `history.js` | Searchable, pinnable, bounded local history store. |
| `ui.js` | Testable accessible DOM helpers, theme, counter, toast, and flashcards. |
| `service-worker.js`, `manifest.webmanifest`, `icons/` | Installable PWA shell and static offline resources. |
| `vercel.json` | PWA manifest and service-worker response headers. |
| `tests/`, `e2e/` | Vitest unit/DOM tests, Playwright user-flow and axe tests. |

## AI integration

The app uses Google's Gemini `generateContent` endpoint in the browser. Each request puts the user's key in the `x-goog-api-key` header (not the URL), and sends a tool-specific instruction followed by the entered/extracted source. Requests time out after 30 seconds. Model text is rendered either through `marked` plus DOMPurify or validated against the quiz/flashcard schema; quiz and card strings are inserted as text, not raw HTML.

Examples of the prompt structure:

| Tool | Example instruction | Why it is structured this way |
| --- | --- | --- |
| Summarizer | “You are an expert AI tutor. Summarize the following study notes concisely. Use bullet points and highlight the most critical information.” | Defines a tutor role, concise task, and scannable format. |
| Explainer | “Explain the following concept clearly, as if explaining to a first-year college student. Always include an easy-to-understand real-world example.” | Sets audience and requires a concrete example. |
| Quiz | “Create exactly 5 multiple-choice questions using only the source material. Difficulty: Medium: apply concepts from the source to a new but familiar situation. Return ONLY a valid JSON array…” | Constrains source, difficulty, count, schema, and answer reasoning for reliable validation. |
| Answer Improver | “Review the draft answer. First provide constructive feedback on what is good and what is missing or incorrect. Then provide a polished, improved version.” | Separates diagnostic feedback from the revised answer. |
| Schedule Maker | “Create a structured, realistic study timetable… Break it down day-by-day or hour-by-hour depending on the context.” | Requests an actionable schedule adapted to provided constraints. |
| Flashcards | “Create exactly 6 flashcards… Respond with ONLY a raw JSON array… `[{\"q\":\"question text\",\"a\":\"answer text\"}]`.” | Requires predictable, validated question/answer data for interactive cards. |

Quiz difficulty definitions are explicit: **Easy** is direct recall, **Medium** applies concepts to a familiar situation, and **Hard** synthesizes ideas and applies critical analysis. Quiz objects also include topic labels, four options, the correct option, and a concise explanation.

## Failure modes and recovery

| Error | What the user sees | Recovery |
| --- | --- | --- |
| Missing/invalid input | Inline validation message; generation does not start. | Enter 10–8,000 characters. |
| Invalid API key/model (400/403) | Settings-oriented error; Retry is not offered. | Correct the key/model in Settings. |
| Rate limit (429) | Friendly rate-limit message and Retry button. | Wait, then Retry. |
| Gemini server error (5xx) | Temporary-unavailability message and Retry button. | Retry later. |
| Timeout (30 seconds) | Timeout message and Retry button. | Retry when ready. |
| Offline/network error | Connection-specific message and Retry button. | Reconnect, then Retry. |
| Empty, blocked, malformed, or wrong-shape response | Clear response/format error; unsafe raw output is not displayed. | Rephrase or Retry. |
| Unreadable upload | File-specific explanation in the input error region. | Try a supported, text-based document. |

## Testing

```bash
npm test                 # focused unit and DOM tests
npm run test:coverage    # tests plus configured coverage thresholds
npx playwright install chromium  # one-time browser download
npm run test:e2e         # quiz success, 429 recovery, and axe
npm run test:a11y        # axe test only
npm run lighthouse       # local mobile Lighthouse HTML report
```

Latest terminal verification (2026-10-11): **26 unit tests passed**; coverage is **94.73% statements, 87.28% branches, 94.44% functions, and 95.59% lines** across the extracted application logic modules. The Playwright suite also passed **4/4 tests**, including the quiz flow, HTTP 429 retry, dialog keyboard behavior, and axe checks. Thresholds are 70% statements and 50% branches. `docs/test-output.txt` summarizes the terminal results. CI repeats coverage and Playwright checks for pushes and pull requests.

The automated axe check currently passes with **no serious or critical violations** on the main page in light and dark themes and with the Settings dialog open. This is not a substitute for a full manual WCAG 2.1 AA audit.

## Accessibility and performance

The UI includes semantic landmarks, a skip link, visible focus, real form labels, labelled icon buttons, live status/error announcements, keyboard-operable flashcards, focus-managed modal/drawer dialogs, reduced-motion handling, and 44px minimum mobile control targets. Contrast is checked by axe in the automated page states; audit all remaining screens and generated results before claiming conformance.

Scripts are deferred or modules; PDF.js and Mammoth load only when the corresponding file is selected. The service worker caches same-origin app-shell assets and never intercepts the cross-origin Gemini API.

| Measurement | Local result | Live Vercel result |
| --- | --- | --- |
| Lighthouse mobile Performance | 99/100 | 94/100 on saved run; a separate run scored 73/100, so performance varies between runs. See `docs/lighthouse-live.html`. |
| Lighthouse mobile Accessibility | 94/100 | 94/100. |
| Lighthouse Best Practices / SEO | 100/100 / 100/100 | 100/100 / 100/100. |
| axe WCAG 2.1 A/AA violations | 0 in automated states listed above | 0 on the main page in light/dark themes and with the Settings dialog open. |

## Deployment

Import this repository into Vercel, leave the root directory at the repository root, select **Other**, set no build/install command, and use `.` as the output directory. The deployment checklist, rollback, and monitoring steps are in [docs/DEPLOYMENT_CHECKLIST.md](./docs/DEPLOYMENT_CHECKLIST.md).

## Known limitations

- Bring-your-own-key: the Gemini key is stored in browser local storage and is accessible to that browser's user. There is no server-side proxy.
- Requests and source text are sent directly to Google when the user generates content.
- The app is client-side only; Gemini generation and CDN dependencies require an internet connection.
- Scanned/image-only PDFs have no OCR.
- AI output can be incomplete or incorrect; review educational content before relying on it.
- The service worker caches the app shell only; it does not provide offline AI generation.

## Future improvements

- Add an optional authenticated backend proxy for shared deployments.
- Add OCR for scanned documents and user-selectable flashcard counts.
- Expand automated tests to remaining interactions and full WCAG review to all generated result states.
- Evaluate streaming output and export formats based on user feedback.

## Screenshots to capture

- `screenshots/01-summarizer-light.png` — main summarizer with example output.
- `screenshots/02-quiz-settings.png` — selected difficulty and question count.
- `screenshots/03-quiz-answer-key.png` — topic labels and revealed answer reasoning.
- `screenshots/04-flashcards.png` — one question-side and one answer-side card.
- `screenshots/05-history.png` — history search and pin state.
- `screenshots/06-settings-dark.png` — settings drawer in dark theme.
- `screenshots/07-mobile.png` — mobile layout and bottom navigation.

## Credits

**Tariq Shah Nawaz** — FlyRank AI Internship - Capstone Project.
