# Multi-source visual pipeline release

This note records the release state produced by the full-roster multi-source visual workflow on 2026-08-25. It intentionally separates a shippable visual-data pipeline from the longer-running goal of literal zero-gap source-backed visual coverage.

## Release result

- 3,588 frame-data move rows audited across the full 89-fighter roster.
- 2,611 move rows currently have real source/reviewed visual records.
- 3,478 real source variants are tracked.
- 2,628 real variants are resolved by truthful full, source-timed, or exact-static mappings.
- 850 real source variants remain unresolved and are preserved explicitly rather than receiving fabricated timing or frames.
- 977 frame-data move rows do not yet have a real visual source; 803 of those are defense rows.
- The deterministic follow-up capture/research queue therefore contains 1,827 jobs.
- External discovery accepted 406 candidates and added source candidates to 31 previously source-less moves.
- Historical SmashWiki research selected 58 older revisions whose source frame counts better reach documented action lengths.
- The Ultimate Hitboxes archive is used as reference-only metadata because the preserved rendered-frame repository does not provide a redistribution license. Zero runtime assets are imported from it.
- Synthetic timing schematics remain non-evidentiary runtime fallbacks and never reduce source-backed blocker counts.

## Release boundary

The multi-source discovery, provenance, vendoring, runtime-index, audit, capture-queue, historical-source, and fallback pipeline is releasable when the exact generated head passes the normal lint/test/TypeScript/build gate. The residual queue is follow-up research/capture work and is not a reason to misrepresent unknown imagery or block deployment of the pipeline itself.

The generated files remain authoritative for exact current counts:

- `docs/VISUAL_COMPLETION_SUMMARY.generated.md`
- `docs/VISUAL_COVERAGE_AUDIT.generated.md`
- `src/data/visualCoverageAudit.generated.json`
- `src/data/visualCaptureQueue.generated.json`
- `src/data/externalVisualSources.generated.json`
- `src/data/smashwikiHistoricalVisuals.generated.json`
- `src/data/ultimateHitboxesArchive.generated.json`
