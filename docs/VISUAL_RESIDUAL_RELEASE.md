# Visual Residual Release

This release marker records the exact generated PR #20 residual-vendor output at `7fe1b20466beee73855a84a808d3a4d397469766`.

- Frame-data move rows: 3,588
- Move rows with real source/reviewed visuals: 2,739
- Move rows still requiring a real visual source/capture: 849
- Real source variants: 3,565
- Resolved real variants: 2,853
- Unresolved real variants: 712
- Total truthful blockers: 1,561
- Deterministic capture queue entries: 1,561

PR #20 recovered four previously source-less special rows. Five source variants were added across those four moves; one passed exact source/timing resolution and four remain explicitly unresolved. No synthetic or unlicensed material is counted as factual completion.

This marker triggers the normal application quality gate against the exact generated output without re-running residual vendoring.
