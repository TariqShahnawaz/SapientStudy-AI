# Audit log

Use the same device/network and Lighthouse settings when recording before/after results.

## Lighthouse

| Category       | Before       | After (local) | Live Vercel result | Date / URL / notes |
| -------------- | ------------ | ------------- | ------------------ | ------------------ |
| Performance    | Not measured | 99/100        | 94/100             | 2026-10-11 — mobile Lighthouse; live report: `docs/lighthouse-live.html`; first live run scored 73/100, so the score varied between runs. |
| Accessibility  | Not measured | 94/100        | 94/100             | 2026-10-11 — mobile Lighthouse; live report: `docs/lighthouse-live.html`. |
| Best Practices | Not measured | 100/100       | 100/100            | 2026-10-11 — mobile Lighthouse; live report: `docs/lighthouse-live.html`. |
| SEO            | Not measured | 100/100       | 100/100            | 2026-10-11 — mobile Lighthouse; live report: `docs/lighthouse-live.html`. |

## axe violations

| Severity | Before count and details | After count and details | Date / URL / notes |
| -------- | ------------------------ | ----------------------- | ------------------ |
| Critical | Not measured            | 0                       | 2026-10-11 — automated axe WCAG 2.1 A/AA checks; local Playwright and live `https://sapientstudy-ai.vercel.app/`; main page in light/dark themes and Settings dialog. |
| Serious  | Not measured            | 0                       | Same automated axe runs and page states as above. |
| Moderate | Not measured            | 0                       | Same automated axe runs and page states as above. |
| Minor    | Not measured            | 0                       | Same automated axe runs and page states as above. |

## One concrete improvement made from audit findings

- Issue: Keyboard users needed an announced flashcard state, and modal/drawer interactions needed predictable focus management and keyboard dismissal.
- Fix: Made flashcards operable by keyboard with an announced flip state; added dialog focus handling, Escape support, and focus return.
- Result (include measured evidence): Automated axe reported zero violations in the tested light-theme, dark-theme, and Settings-dialog states on both the local app and live URL on 2026-10-11. This does not replace a full manual WCAG audit. Live mobile Lighthouse scored 94/100 for Performance on the saved run; another run scored 73/100, showing run-to-run variation.
