# Visual Coverage Audit

- Frame-data moves: **3588**
- Moves with an evidence-backed same-origin visual: **3588/3588**
- Blocking visual gaps: **0**
- Blank visual cards: **0**
- Remote runtime media: **0**
- Action-specific source/reviewed visuals: **2739**
- Evidence-derived fallback visuals: **849**
  - Related-source references: **16**
  - Documented timing schematics: **833**
- Blocking move/variant gaps: **0**

Every committed frame-data row now has a local visual representation backed by committed evidence. The fallback layer does not invent gameplay poses, hitbox geometry, or undocumented timing.

## Evidence policy

Related-source references remain labelled as related references and are not exact target-state evidence. Timing schematics are driven by committed SSBU frame data and structured UFD defense timing where available; they are not presented as captured gameplay or exact fighter-pose imagery. Exact frame claims remain restricted to source/reviewed media that passes the existing timing gate.

## Optional action-specific fidelity upgrades

The old source-only audit counted rows without action-specific captured/source media as blocking visual gaps. Those rows now have evidence-backed local visuals and therefore do not block visual completion. Replacing them with action-specific captured motion remains an optional fidelity upgrade:

- `defense`: **796**
- `misc`: **35**
- `special`: **10**
- `grab`: **6**
- `ground`: **2**

## Optional exact/source-variant upgrades

The source library also retains **904** variants that are useful references but are not suitable for exact frame mapping. They remain explicitly non-exact:

- `short-or-misaligned-source`: **616**
- `missing-documented-timing`: **173**
- `static-source-needs-motion`: **115**

These fidelity queues are preserved so future source/capture improvements can replace conservative fallbacks without ever fabricating evidence. They are not blank/unrepresented visual blockers.
