# Project guidance

- Read `context/zw-js-coding-preference.md` before code edits.
- Follow `context/git-commit-convention.md` for commits.
- Read `context/source-guidelines.md` before content changes.
- Work on `main`. Use tabs, leading commas, named functions, relative asset paths.
- Vanilla HTML/CSS/JavaScript; JSON is the editorial source of truth.
- The root model catalog defaults to S27 Ultra; each selected model loads only its own manifest and reports.
- Run `npm run build`, `node scripts/check-history.js`, `git diff --check`, and direct behavior checks before publication.
- Keep verification proportionate: this simple static project intentionally has no automated test suite or test framework.
- Never rewrite a historical snapshot or invent a past observation.
- No secrets, analytics, personal data, copied publisher imagery or unsupported specifications.
- Full update procedure: `docs/UPDATING.md`. Record execution in `docs/PROGRESS.md`.
