# Phase I checkpoint — Training, frame data, and visual study

This file records the immutable project checkpoint immediately before the Pro VOD Learning System begins.

## Checkpoint identity

- Production commit: `bdb4ce61e180fb2ef2fa5ca0bffaa186ee501e65`
- Successful GitHub Pages workflow run: `32997107822`
- Checkpoint branch: `checkpoint/phase1-training-frame-data-complete`
- Checkpoint date: 2026-08-26
- Completed milestone range: M01–M70

The checkpoint branch is intentionally not used for normal development. New work continues from `main` on dedicated feature branches.

## Release state

- 89 independent fighter pages are present.
- 3,588 / 3,588 frame-data move rows have a same-origin evidence-backed visual representation.
- Blocking visual gaps: 0.
- Blank runtime visual cards: 0.
- Automatic third-party runtime media requests: 0.
- Action-specific source/reviewed visual rows: 2,739.
- Evidence-backed fallback rows: 849, comprising 16 related-source references and 833 documented timing schematics.
- Optional fidelity backlog remains separate from release completeness: 849 action-specific replacement opportunities and 904 unresolved/non-exact source variants.

## Integrity rules preserved at the checkpoint

1. Never fabricate SSBU gameplay frames, fighter poses, hitbox geometry, hurtbox geometry, timing, or player intent.
2. A timing schematic is not gameplay footage and must never be presented as such.
3. Related-source fallback media is not exact target-action evidence.
4. Runtime-loaded media remains same-origin unless a future milestone explicitly changes the policy.
5. External references are user-opened links, not silent runtime requests.
6. Total Frames and FAF remain distinct concepts.
7. Unknown information stays unknown rather than being inferred merely to make coverage appear complete.

## Recovery procedure

If Phase II work ever needs to be abandoned or redesigned, restore from the checkpoint branch or the production commit above. The Phase I checkpoint should not be rewritten to include later Pro Lab data or UI changes.
