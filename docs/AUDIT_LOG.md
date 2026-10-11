# Audit log

Use the same device/network and Lighthouse settings when recording before/after results.

## Lighthouse

| Category       | Before | After   | Date / URL / notes                                                                                    |
| -------------- | ------ | ------- | ----------------------------------------------------------------------------------------------------- |
| Performance    | 76/100 | 99/100  | 2026-10-11 — local mobile Lighthouse;`npm run lighthouse`; report: `docs/lighthouse-local.html`. |
| Accessibility  | 70/100 | 94/100  | 2026-10-11 — local mobile Lighthouse;`npm run lighthouse`; report: `docs/lighthouse-local.html`. |
| Best Practices | 89/100 | 100/100 | 2026-10-11 — local mobile Lighthouse;`npm run lighthouse`; report: `docs/lighthouse-local.html`. |
| SEO            | 86/100 | 100/100 | 2026-10-11 — local mobile Lighthouse;`npm run lighthouse`; report: `docs/lighthouse-local.html`. |

## axe violations

| Severity  | Before count and details | After count and details | Date / URL / notes                                                                                                 |
| --------- | ------------------------ | ----------------------- | ------------------------------------------------------------------------------------------------------------------ |
| Critical  | 0                        | 0                       | 2026-10-11 — automated Playwright/axe WCAG 2.1 A/AA checks on main page in light/dark themes and Settings dialog. |
| Serious   | 0                        | 0                       | 2026-10-11 — automated Playwright/axe WCAG 2.1 A/AA checks on main page in light/dark themes and Settings dialog. |
| Moderate0 | 0                        | 0                       | 2026-10-11 — automated Playwright/axe WCAG 2.1 A/AA checks on main page in light/dark themes and Settings dialog. |
| Minor     | 0                        | 0                       | 2026-10-11 — automated Playwright/axe WCAG 2.1 A/AA checks on main page in light/dark themes and Settings dialog. |

## One concrete improvement made from audit findings

- Issue: Keyboard users needed an announced flashcard state, and modal/drawer interactions needed predictable focus management and keyboard dismissal.
- Fix: Made flashcards operable by keyboard with an announced flip state; added dialog focus handling, Escape support, and focus return.
- Result (include measured evidence): The Playwright/axe WCAG 2.1 A/AA checks passed with zero violations in the tested light-theme, dark-theme, and Settings-dialog states on 2026-10-11. This result covers those automated states; it is not a full manual WCAG audit.
