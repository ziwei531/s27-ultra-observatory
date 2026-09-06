# Verification record

## Proportionate checks

Galaxy Leak Observatory is a small static HTML/CSS/JavaScript project. It intentionally has no automated test suite, browser-test framework or runtime dependencies.

Before publication:

- build the explicit Pages artifact with `npm run build`;
- run `node scripts/check-history.js` to reject changes to published snapshots;
- run `git diff --check` and inspect the complete diff;
- verify each model manifest points to an existing snapshot with the recorded SHA-256;
- directly inspect default S27 loading, S23 selection, URL persistence and strict report isolation;
- inspect desktop and mobile layout in the deployed page;
- run `scripts/verify-live.js` against the deployed URL to compare the catalog, manifests, snapshots, timeline and static assets byte-for-byte.

## Data integrity

- Existing S27 history remains byte-identical.
- S23 is a retrospective archive collected on 6 September 2026; source publication dates remain separate from first observation dates.
- Confirmed claims require supporting official Samsung evidence.
- Source URLs are HTTPS and publisher versus underlying tipster provenance is recorded.
- No publisher imagery, tracking assets, secrets or personal data are included.

## Deployment evidence

The original S27-only deployment was verified by [workflow 33979111971](https://github.com/ziwei531/galaxy-leak-observatory/actions/runs/33979111971) at commit `1d6aae022002d9aded10692de08d38d4dbbb935d`.

For the multi-model release, the newest Pages workflow and live read-back are the authoritative evidence. Do not claim deployment success from a push alone.
