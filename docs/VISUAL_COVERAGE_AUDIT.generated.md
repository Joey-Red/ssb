# Visual Coverage Audit

- Frame-data moves: **3588**
- Moves with an evidence-backed local visual: **3588/3588**
- Blocking visual gaps: **0**
- Blank visual cards: **0**
- Remote runtime media: **0**
- Action-specific source/reviewed visuals: **2739**
- Evidence-derived fallbacks: **849**
  - Related-source references: **16**
  - Documented timing schematics: **833**

Every frame-data row has a same-origin visual backed by committed evidence. Evidence-derived fallbacks remain explicitly labelled and are not presented as captured gameplay, exact fighter poses, or hitbox geometry.

## Optional action-specific fidelity upgrades

Action-specific captured/source media is still absent for **849** rows. These rows are no longer visual blockers because they have validated evidence-backed local representations; they remain an optional replacement queue for higher-fidelity captured motion.

- `defense`: **796**
- `misc`: **35**
- `special`: **10**
- `grab`: **6**
- `ground`: **2**

## Optional exact/source-variant upgrades

There are **662** source variants that remain unsuitable for exact frame mapping. They stay labelled as partial/static/source-timed evidence and are never promoted to exact timing without proof.
