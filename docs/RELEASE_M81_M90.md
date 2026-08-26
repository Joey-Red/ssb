# Release checkpoint — M81–M90 Pro Lab

## Scope

This checkpoint releases the Competitive Decision Lab as a first-class static learning area while preserving the project’s non-fabrication rule.

## Delivered

- M81: evidence-traceable character lesson generation.
- M82: “What would you do?” pre-decision trainer and reveal flow.
- M83: references into the existing committed frame-data snapshot; no copied unsupported numbers.
- M84: reviewed moment → local custom drill bridge.
- M85: matchup-specific evidence aggregation with multi-VOD thresholds.
- M86: multi-player style comparison with a two-player evidence gate.
- M87: current/recent/legacy evidence classification and explicit unknown patch handling.
- M88: structural maintenance audit plus scheduled external link-health audit workflow.
- M89: full 89-fighter coverage-state matrix and sparse-corpus visibility.
- M90: first-class Pro Lab route/navigation/UI, mobile/desktop accessibility, release validation, and GitHub Pages delivery.

## Evidence integrity at release

The initial VOD catalog is source-backed. Tactical decision annotations are still zero because no footage annotation is promoted merely from set metadata. As a result, production lessons, exercises, matchup claims, and player-style comparisons also remain zero until reviewed decision moments are added. This is intentional and test-enforced.

Automated tests use explicitly synthetic decision fixtures to exercise M81–M89 algorithms. Synthetic fixtures never ship as claims about real players.

## Runtime boundary

- No server, database, login, telemetry, or runtime AI.
- No automatic third-party video/media requests.
- Tournament video/source links are user-opened references.
- Frame values are resolved from the same-origin committed snapshot.
- Practice drills remain browser-local.
- External link-health checks run in GitHub Actions maintenance, not in the deployed app.

## Release gate

The release is eligible to merge only after the exact PR head passes `npm run check`, including lint, the complete Vitest suite, strict TypeScript, and the Vite production build. The merged `main` head must then complete the GitHub Pages workflow before this checkpoint is considered deployed.
