# Implementation plan

- [x] Preserve the original S27 Ultra snapshot and earliest-report timeline.
- [x] Add a model catalog with S27 Ultra as the default.
- [x] Add a sourced retrospective S23 Ultra leak record with launch outcomes.
- [x] Isolate loaded reports by selected model and persist non-default selection in the URL.
- [x] Generalize project naming, interface copy, scripts, documentation and Pages paths.
- [x] Remove disproportionate automated-test infrastructure; keep build, history and direct behavior checks.
- [x] Rename the GitHub repository, push the coordinated change and verify the deployment.

Design remains deliberately small: warm paper, black ink, restrained rust accent, editorial headlines and readable evidence metadata. No framework, external fonts, analytics or runtime dependencies. Each model owns a manifest and immutable snapshots; the root catalog only selects the model collection.
