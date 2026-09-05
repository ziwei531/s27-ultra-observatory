# Weekly editorial update runbook

Run from the repository root after reading `AGENTS.md`, the coding preferences and `context/source-guidelines.md`. A scheduled agent must actually search and fetch sources; scripts do not manufacture “new leaks”. Do not create a snapshot solely because a week elapsed.

## Exact recommended scheduled-agent process

1. `git status --short` — stop on someone else's changes. `git pull --ff-only origin main`. Run `date -Iseconds`; use the current **Asia/Kuala_Lumpur** collection date, never an article's earlier date.
2. Read `data/index.json`, its latest snapshot, `docs/RESEARCH.md`, and these source rules. Search broadly for `Galaxy S27 Ultra leaks` plus the current month/year; also search Samsung Newsroom, SamMobile, Android Authority, Android Central, GalaxyClub and 9to5Google. Seek original reports behind reposts. Fetch/read the actual pages and record publication/updated and access dates. Do not rely on snippets. Exclude inaccessible or fabricated-spec aggregator pages; log failures honestly.
3. Compare with the current snapshot by claim, not headline. Check camera count, regional processors, battery rated/typical units, charging/certification, display and official announcements. Add contradictory evidence without deleting the older account. Never turn repeated coverage of one tip into independent corroboration. A review must describe sources attempted and any access gaps.
4. **If material evidence changed**, make a draft (replace the date below with the real tool-observed date):

   ```sh
   npm run review:week -- YYYY-MM-DD
   ```

   Edit `.work/YYYY-MM-DD.json`: replace the placeholder title/summary, add or revise claims and evidence, add fully read sources with dates/provenance. Keep existing `firstObservedAt` values; newly observed claims get the actual collection date. Source dates never become snapshot dates. Keep old sources needed by old claims. Superseded requires a valid `supersededBy`; confirmed requires supporting `kind: official` evidence. Confidence always has an explanation. Old snapshots are never edited.

   ```sh
   npm run review:week -- YYYY-MM-DD --publish --notes="Reviewed [source URLs and dates]; [specific material changes]; [access limitations]."
   ```

   This writes the new sealed snapshot and updates the catalog **locally only**. It does not commit, push, or assert successful deployment.

5. **If nothing material changed**, do not create a snapshot and do not change any old snapshot:

   ```sh
   npm run review:week -- YYYY-MM-DD --no-change --notes="Reviewed [source URLs and date range]; no material new evidence; [access limitations]."
   ```

   Only `data/index.json` gains a completed no-change record; the visible collection date remains unchanged, while “Last review” advances. Repeated articles, spelling-only edits and access-date refreshes alone are NOT material changes. If research was blocked comprehensively, record the failure in `docs/PROGRESS.md`, not a completed no-change review; do not imply the news was checked.

6. Add concise source/change findings to `docs/PROGRESS.md` (and `docs/RESEARCH.md` when needed). Run:

   ```sh
   npm test
   npm run build
   git diff --check
   git diff --stat
   git diff -- data/index.json docs/PROGRESS.md
   ```

   Review the full new snapshot, check copyright/PII/secrets and test counts; no raw articles, credentials or copied publisher imagery. For artwork use original labeled illustration unless explicit redistribution rights are recorded and validation is deliberately updated.
7. Commit only intended files using Conventional Commits, then push main:

   ```sh
   git add data/index.json data/snapshots docs/PROGRESS.md docs/RESEARCH.md
   git commit -m "content: review S27 Ultra evidence for YYYY-MM-DD"
   git push origin main
   gh run list --workflow pages.yml --limit 1
   gh run watch RUN_ID --exit-status
   GITHUB_SHA=$(git rev-parse HEAD) node scripts/verify-live.js
   ```

8. Completion means the `verify`, `deploy` **and** `verify-live` jobs passed, and the published JSON exactly matches disk. If the new site fails validation, report the blocker; never say published on the strength of a push alone. A post-deployment live-check failure may mean the site is already updated: inspect before retrying or reverting.

## Copyable scheduler task

“Within `/data/data/com.termux/files/home/s27-ultra-observatory`, follow AGENTS.md and docs/UPDATING.md. Run the date tool, perform fresh S27 Ultra source research, add an immutable snapshot only for material evidence, otherwise record an honestly completed no-change review. Run tests, commit and push main, wait for all Pages workflow jobs, and verify live JSON against the commit. Report only real changes or blockers. Never fabricate history, renders, sources or a successful check.”

The repository intentionally contains no cron setup. The supervising agent may schedule this task separately. One completed review per date is supported. If the same day needs a correction before sealing, edit its uncommitted draft; after publication, use a later dated snapshot, leaving the original intact. Emergency application-code fixes need not create content snapshots.

## Recovery and integrity

- A draft is safe to edit or discard in `.work/`; this directory is ignored and never deployed.
- The helper uses exclusive creation for snapshot files and a temporary catalog + rename. If interrupted between these two writes, an orphan snapshot may remain: stop, inspect it, and reconcile the uncommitted catalog before proceeding. Do not overwrite published snapshots.
- Hash validation catches drift; the workflow also compares all preexisting snapshot files against the parent commit and rejects alterations/deletions. Do not defeat this by modifying the hash to match a rewrite.
- For a new category or a new non-SVG license policy, update the model, validator, tests and documentation in one reviewed change.
- No-change scripts trust your stated review; they do not verify that research occurred. The run notes must therefore be specific and auditable.
