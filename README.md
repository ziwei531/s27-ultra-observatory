# S27 Ultra Observatory

**[Visit the live archive](https://ziwei531.github.io/s27-ultra-observatory/)** · [Source repository](https://github.com/ziwei531/s27-ultra-observatory)

An independent, editorial Galaxy S27 Ultra rumor archive. Search and filter dated field notes, inspect original reporting chains, compare disputed accounts and revisit immutable collection snapshots. It is not a confirmed specification sheet and is not affiliated with Samsung.

## What is inside

- Baseline collected **6 September 2026**: 10 field notes, eight readable sources, four disputed entries (two disagreements). Article dates are not invented collection dates.
- Warm-paper editorial layout, original optical artwork (clearly labeled as illustration), mobile layout, keyboard navigation, accessible source disclosures and shareable filtered/deep-linked views.
- Separate source dates, access dates, first-observation dates, evidence relations and editorial confidence.
- Reported / disputed / superseded / confirmed states. The baseline deliberately has no superseded or confirmed claims.
- No runtime dependencies, analytics, cookies, third-party fonts, image hotlinks or trackers.

## Local development

Requires Node.js 22 or newer. Only browser test tools are installed; the website has no package runtime.

```sh
npm ci
npm test
npm run build
npm run serve
```

Open `http://127.0.0.1:4173/s27-ultra-observatory/`. Do not open `index.html` directly: the build assembles `views/archive.html` into the root shell. The production artifact is explicitly limited to HTML, JavaScript, styles, artwork, data and a commit manifest.

On a supported desktop/Linux host:

```sh
npx playwright install --with-deps chromium
npm run test:browser
```

Native Termux does not support the browser helper used in the initial build; the same Playwright suite runs in GitHub-hosted Chromium before deployment and again against the public URL. See [verification evidence](docs/VERIFICATION.md).

## Weekly research

Read **[docs/UPDATING.md](docs/UPDATING.md)**. Start a dated working copy:

```sh
npm run review:week -- YYYY-MM-DD
```

This command creates a draft, **not fresh research**. Fetch/read sources and assess changes before publishing. The helper refuses future dates, duplicate dates, unchanged-content snapshots and historical-file overwrites. No-change reviews add only a review record. Scheduling is external and is not installed by this repository.

## Architecture

| Path | Purpose |
| --- | --- |
| `index.html`, `views/` | Stable shell and semantic archive view, assembled at build time |
| `js/` | Safe DOM rendering, query state, filtering and date formatting |
| `styles/`, `assets/` | Responsive visual system; original local artwork |
| `data/index.json` | Snapshot catalog with SHA-256 seals and completed review log |
| `data/snapshots/` | Immutable self-contained claims, sources and image attribution |
| `scripts/` | Explicit build, validation, local server, review helper and live verification |
| `test/` | Data/security/model tests and real-browser accessibility/navigation checks |
| `context/` | Coding preferences, source guidelines and repository instructions |
| `.github/workflows/pages.yml` | Test → Chromium checks → Pages → live Chromium checks |

## Publication and rights

GitHub rejected Pages for the initially private repository with HTTP 422: the account plan does not support private-repository Pages. The repository was made public under the user's explicit authorization for a nonpersonal compilation. No private user data is included.

Our code is MIT-licensed; original SVG artwork is CC0-1.0. Original editorial summaries may be reused under CC BY 4.0 with attribution to S27 Ultra Observatory. Referenced reporting and product names remain the property of their respective owners. Vendored coding preferences retain their upstream provenance; our license does not relicense those files. No publisher imagery or article text has been republished.
