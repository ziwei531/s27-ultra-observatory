# Verification record

## Local baseline checks

Native Termux: `npm install --ignore-scripts` succeeded, audit reported zero vulnerabilities. `npm test`: ten data/model/security/update-helper tests passed. `npm run build`: explicit Pages artifact built successfully.

The browser-use helper failed before launch because its psutil dependency does not support Android. No Hermes runtime changes or Android system modifications were attempted. Real Chromium tests run on GitHub-hosted Linux instead.

## Automated acceptance gates

- Snapshot schema, SHA-256 seals, references, dates, unique identifiers, source HTTPS URLs, attribution paths, claim states and confidence values.
- Baseline exactly 10 claims, eight sources, four disputed records, and one real observation date.
- Search/category/state filters, chronological order, hostile query handling, safe DOM sinks, invalid schema cases and superseded-state model support.
- Chromium desktop 1440×1000 and mobile 390×844: page errors, loaded artwork, viewport overflow, main/header/evidence edge equality, keyboard skip link, axe WCAG A/AA checks, source drawers, combined filters, reset/empty states, persistent URL queries, deep links, back navigation and failure recovery.
- Additional real geometry check at 320 pixels and enlarged root text. This is not a substitute for manual screen-reader or physical-device testing.
- Future snapshot switching uses isolated browser response fixtures explicitly labeled TEST FIXTURE ONLY. Synthetic records never enter deployed JSON.
- Identical browser suite runs against the public Pages URL after deployment. A manifest pins the deployed commit; live HTML asset versions, all snapshot bytes and local assets are fetched.
- Browser screenshots, geometry attachments and HTML reports are uploaded as Actions artifacts.

## Review scope

Self-review: no runtime dependencies, no external data endpoints, no innerHTML/eval sinks, strict local paths, HTTPS source URL validation, no secrets/PII or publisher image copies. JavaScript uses tabs and leading commas, named functions, strict equality and source-facing error states. The commit convention follows the vendored preference file.

Independent reviewer delegation was not available to this leaf task. Do not interpret this document or commit message as independent reviewer approval. Automated tests and a separate self-review are the actual gates used.

## Design deliberation

Primary surface: Explore. Chosen composition: asymmetric editorial introduction and abstract optical study; a compact snapshot selector; an evidence list with a narrow filter column; inline source drawers; a restrained standards section. Rejected a fake product-render launch page (suggests certainty) and a marketing card grid (weak evidence navigation). Palette: warm paper, dark green-black ink, rust for editorial emphasis. Georgia gives headline contrast; Arial keeps lengthy source notes readable without web-font requests.

Self-audit: no glossy technology gradient background, default indigo, feature-tile grid, accent rail, glass blur, monument statistics, icon toppers, center-stack or inappropriate hero-led monitor composition. The artwork contains a localized optical radial shading, not a glossy site background. Intro is short and subordinate to the navigable archive. No motion beyond native interactions.

## Actual live evidence — 6 September 2026

[Workflow 33979111971](https://github.com/ziwei531/s27-ultra-observatory/actions/runs/33979111971) passed all three jobs: verify, deploy and verify-live. Initial verified deployment commit: `1d6aae022002d9aded10692de08d38d4dbbb935d`.

- Ten Node tests passed locally and in the build gate.
- Twelve real Chromium browser cases passed before deployment and twelve passed against the public Pages URL (six scenarios × desktop/mobile).
- Live desktop: viewport/scroll width **1440/1440**, main edges **60–1380**, filter/results columns **235 / 1033**, gap **52** pixels.
- Live mobile: viewport/scroll width **390/390**, main edges **18–372**, one **354**-pixel results column.
- Header-to-main and evidence-to-main left/right deltas were all **0 pixels** at both sizes.
- Axe WCAG A/AA scans returned **zero violations** in the default view; zero captured page errors. Manual screen-reader testing and other browser engines remain untested.
- Live byte verification passed: catalog, every snapshot, commit-versioned HTML and five static asset endpoints. A separate native-Termux fetch repeated the live verification successfully.
- Downloaded the `live-browser-evidence` artifact and visually inspected both full-page screenshots plus native-resolution crops of the desktop/mobile introduction and snapshot selector. Typography, image disclaimer, alignment and responsive reflow were intact; no clipping was visible.

Artifacts: Actions run → `browser-evidence` and `live-browser-evidence`. Each contains full-page desktop/mobile PNG files and a Playwright HTML report with geometry attachments. The final documentation commit reruns the same gates; use the newest successful run for the current deployed commit.

Nonblocking platform warning: GitHub forced the official v4 checkout/setup-node/upload-artifact actions from their declared Node 20 runtime to Node 24. Both local and live verification jobs succeeded. The project application/test runtime is Node 22 in CI.

