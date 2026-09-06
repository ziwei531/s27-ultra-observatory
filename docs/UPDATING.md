# Editorial update runbook

Run from the repository root after reading `AGENTS.md`, the coding preferences and `context/source-guidelines.md`. Scripts never manufacture evidence, and elapsed time alone never justifies a new snapshot.

## Model-aware review

1. Check `git status --short`, pull `main` with fast-forward only, and query the current Asia/Kuala_Lumpur date.
2. Read `data/index.json`, choose the model, then read its manifest, latest snapshot and `docs/RESEARCH.md`.
3. Search broadly for the full generation name plus its variants (`Galaxy S22`, `S22+`, `S22 Ultra`, and any Edge/FE model where relevant) and the current month/year. Do not reduce a family review to an Ultra-only query. Check reputable Galaxy publishers and Samsung Newsroom. Fetch actual pages, seek the source behind reposts, and log access gaps.
4. Compare evidence by claim rather than headline. Preserve contradictions and keep rated versus typical battery units distinct.

The root catalog defaults to `s27-ultra`. Family reviews use `s22`, `s23`, `s24`, `s25` or `s26`; pass the generation explicitly:

```sh
npm run review:week -- YYYY-MM-DD --model=s23
```

This creates `.work/s23-YYYY-MM-DD.json`. A draft is only a copy, not new evidence.

After research and editing, publish a material update locally:

```sh
npm run review:week -- YYYY-MM-DD --publish --model=s23 --notes="Reviewed [sources and dates]; [material changes]; [access limitations]."
```

Or record an honestly completed no-change review without creating a snapshot:

```sh
npm run review:week -- YYYY-MM-DD --no-change --model=s23 --notes="Reviewed [sources and date range]; no material new evidence; [access limitations]."
```

Omit `--model` for the default S27 Family collection. The helper updates only the selected model manifest. It does not commit, push or claim deployment success.

## Publication checks

```sh
npm run build
node scripts/check-history.js
git diff --check
git diff --stat
```

Review the full snapshot, copyright, personal data, secrets and validation output. Directly inspect the built catalog, model manifests and selected-model behavior. Keep old sources required by old claims. `superseded` needs a valid replacement; `confirmed` needs supporting official evidence. Existing snapshots are never rewritten.

This simple static project intentionally carries no automated test suite or browser-test framework. Keep checks proportionate and verify the deployed files directly.

Commit only intended paths with a Conventional Commit, push `main`, wait for all Pages jobs, then verify the live commit and JSON:

```sh
git push origin main
gh run list --workflow pages.yml --limit 1
GITHUB_SHA=$(git rev-parse HEAD) node scripts/verify-live.js
```

Completion means verify, deploy and verify-live all pass. A push alone is not publication proof.

## Adding another model

1. Add its identifier, labels and manifest path to `data/index.json`.
2. Create `data/models/MODEL-ID.json` and its immutable snapshot directory.
3. Record real fetched sources, source dates and the archive’s actual observation date.
4. Add tests proving its report count and strict isolation from every other model.
5. Update research notes and run the complete publication checks.

The repository intentionally contains no cron setup. Emergency application-code fixes need not create content snapshots.
