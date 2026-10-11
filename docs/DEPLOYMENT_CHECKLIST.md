# Deployment checklist

## Pre-deploy

- [X] `npm run test:coverage` passes and coverage meets configured thresholds.
- [X] `npm run test:e2e` passes; CI is green for the release commit.
- [X] Review the repository and Git diff for secrets; no API keys or `.env*` files are committed.
- [X] Run local mobile Lighthouse and save `docs/lighthouse-local.html`.
- [X] Run automated axe checks on the main page in light/dark themes and with the Settings dialog open.
- [ ] Manually inspect full WCAG 2.1 AA behavior, including generated results and mobile navigation.
- [X] Manually verify invalid-key, 429, server/network/timeout, malformed-output, and unreadable-upload states.
- [X] Bump the service-worker cache version when changing cached app assets.
- [X] Confirm Vercel root is the repository root, framework is Other, build/install command is empty, and output directory is `.`.

## Deploy

1. Merge/push the verified release to the configured Vercel production branch.
2. Confirm the production deployment succeeds in the Vercel dashboard.
3. Confirm no Gemini key is configured as a Vercel environment variable.

## Post-deploy smoke test

- [X] Open the live URL in a clean browser session and verify the page loads over HTTPS.
- [X] Check navigation, theme, dialog/drawer keyboard behavior, and PWA install prompt where supported.
- [X] Enter a reviewer-owned Gemini key and try one successful quiz and one ordinary text tool.
- [X] Verify a rejected request produces a useful error and Retry; confirm API calls are not cached.
- [X] Verify text upload and confirm unsupported/scanned content gives a clear explanation.
- [X] Run Lighthouse and axe against the live URL; results are recorded in `docs/AUDIT_LOG.md` and the mobile Lighthouse report is saved as `docs/lighthouse-live.html`.

## Rollback plan

In Vercel, open **Deployments** and promote the previous successful deployment. Alternatively, revert the faulty commit and push the revert so Vercel creates a replacement deployment.

## Monitoring plan

Review Vercel deployment/function logs for delivery issues. This app has no application backend; after each release, perform a manual smoke test on the live URL and inspect browser console/network errors.

## Sign-off

- Release URL: https://sapientstudy-ai.vercel.app/
- Date: ____________________
- Name: ____________________
- Sign-off: __________________________________________________
