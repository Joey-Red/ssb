# Pro Lab content status

Reference date: 2026-08-27

The controlling completion target is documented in `docs/PRO_LAB_LONG_TERM_PLAN.md`. Technical milestone completion does not mean the Pro Lab is feature-complete; future work should continue until actual user-facing content is extensive across the roster.

## Current corpus

- 89 canonical fighter pages remain represented by the Pro Lab research registry.
- 64 provenance-backed player representatives are cataloged.
- The top 28 characters / combined character groups in UltRank Half Year 2026 representation all have at least one provenance-backed representative candidate.
- **507 tournament-set learning records are cataloged**, including **278 source-date anchors from 2026**.
- **72 records resolve to direct watch/stream URLs.** The remaining **435 records are source-index acquisitions** whose exact watch URL still needs resolution.
- **71 distinct direct-footage review units are queued.** Source-index records are deliberately excluded from tactical review until their direct video URL is resolved.
- The 300-record historical expansion spans public competitive-set index entries from **2021 through 2026** across **25 established representatives**.
- Against the working 800-set depth benchmark, the catalog is now about **63% populated**; roughly **293 additional unique sets** would reach that benchmark before distribution/quality adjustments.
- KAGARIBI #15 final-day navigation coordinates cover the streamed top-bracket path from Winners Quarterfinals through Grand Finals.
- Fighter VOD libraries index both sides when both characters are confirmed. Historical source-index records intentionally leave opponent fighter IDs empty until direct evidence resolves them.
- The public VOD library supports search plus tier, era, review-state, and sort controls and labels source-index records separately from direct VOD links.

## Evidence boundary

Metadata acquisition is not tactical analysis. Player tags, character usage, event/source labels, results, VOD URLs, and published stream coordinates may be stored when source-backed. A `ProDecisionMoment` may only be added after direct gameplay review verifies the observable state, chosen option, outcome, timestamp, and teaching tags.

A source-index record is one step earlier than a direct VOD record. It establishes a competitive set discovery path, but it does **not** claim that the direct watch URL has already been resolved. The 300 historical records also use the public source-index date as a **date anchor**, not an assertion that the value is always the exact tournament-set day. Exact opponent character, exact patch, per-game switching, upload-channel quality, and tactical interpretation remain unclaimed until stronger evidence exists.

Accordingly, the tactical annotation corpus intentionally remains empty. This prevents rankings, page descriptions, bracket results, video titles, or discovery indexes from being transformed into invented player intent or invented in-game decisions.

## 2026 research priority source

`src/data/proLabResearchPriorities.ts` records the top 28 UltRank Half Year 2026 character-representation entries. This metric is tournament game-win representation, not a tier list. It is used only to order research effort.

The final five previously uncovered top-28 entries were closed with current source-backed representatives:

- Mii Brawler — Yopi
- Roy — Kola
- Greninja — Tarik
- Donkey Kong — Mild na H.O
- Hero — Akakikusu

## Acquisition history

- Extensive-library batch 1 added 19 source-backed 2026 set records from KAGARIBI #15, LVL UP EXPO 2026, and Let's Make BIG Moves 2026.
- Batch 2 added 9 source-backed MomoCon 2026 sets and broadened the representative pool.
- Batch 3 added 11 records with an explicit thin-character bias.
- Batch 4 changed the cadence to bulk research and added 89 source-indexed 2026 tournament sets from Patchwork, S Factor X3, Comicpalooza Fight Club, and Supernova.
- Batch 5 added 61 more 2026 sets and resolved 15 direct watch targets while preserving acquisition vs. review state.
- **Batch 6 adds 300 additional competitive-set discovery records in one pass**, deliberately allowing useful older final-balance-era footage instead of restricting the library to the current calendar year. These records span 2021–2026 and deepen 25 already provenance-backed player libraries without fabricating missing opponent-character, patch, result, or tactical data.

## Acquisition cadence going forward

Large corpus work should continue in substantial passes instead of stopping after a handful of records. At 507 cataloged sets, the project is now much closer to the 700–800+ library depth target, but raw acquisition is only one stage.

The next acceleration priority is **bulk direct-link resolution** for the 435 source-index records, followed by direct footage review. New acquisitions should still focus on characters whose fighter-set coverage remains thin rather than merely adding more records to already-deep players.

## Next content work

1. Add roughly 293 more useful unique sets to reach the working 800-set benchmark, with fighter-level distribution taking priority over a raw number.
2. Resolve the 435 source-index records to stable direct watch URLs in large batches; move them into direct-review readiness only after resolution.
3. Expand each fighter toward 2–5 credible representatives where the competitive record supports them.
4. Audit per-fighter depth against the roughly 12-set floor and target the thinnest libraries first.
5. Review direct VOD targets and record only directly observable decision moments with exact in-video timestamps.
6. Grow the reviewed tactical corpus toward thousands of real moments so lessons, decision exercises, matchup patterns, player comparisons, set breakdowns, frame-data references, and practice actions become genuinely extensive.
7. Keep historically useful sets explicitly separated from current evidence rather than deleting them or pretending their exact patch metadata is known.

## Primary public provenance

- UltRank Half Year 2026: https://www.ssbwiki.com/UltRank_Half_Year_2026
- KAGARIBI #15 final-day stream: https://www.youtube.com/watch?v=mVflVyrWS5Y
- KAGARIBI #15 tournament page: https://www.ssbwiki.com/Tournament:Kagaribi_15
- LVL UP EXPO 2026 tournament page: https://www.ssbwiki.com/Tournament:LVL_UP_EXPO_2026
- Let's Make BIG Moves 2026 tournament page: https://www.ssbwiki.com/Tournament:Let%27s_Make_BIG_Moves_2026
- MomoCon 2026 tournament page: https://liquipedia.net/smash/MomoCon/2026
- Patchwork 2026: A Love Letter: https://liquipedia.net/smash/Patchwork/2026
- S Factor X3: https://www.ssbwiki.com/Tournament:S_Factor_X3
- Comicpalooza Fight Club 2026: https://www.ssbwiki.com/Tournament:Comicpalooza_Fight_Club_2026
- Supernova 2026: https://www.ssbwiki.com/Tournament:Supernova_2026
- Battle of BC 8: https://liquipedia.net/smash/Battle_of_BC/8/Ultimate
- Flash Flood: https://www.ssbwiki.com/Tournament:Flash_Flood
- DELTA x Seibugeki Open: https://www.ssbwiki.com/Tournament:DELTA_x_Seibugeki_Open
- Get On My Level 2026: https://www.ssbwiki.com/Tournament:Get_On_My_Level_2026
- Public set discovery index used for bulk historical acquisition and later link resolution: https://www.smash-tube.com/
- Per-player and per-record provenance remains attached to the catalog entries; unknown metadata stays unknown.
