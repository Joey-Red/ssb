# Pro Lab content status

Reference date: 2026-08-27

The controlling completion target is documented in `docs/PRO_LAB_LONG_TERM_PLAN.md`. Technical milestone completion does not mean the Pro Lab is feature-complete; future work should continue until actual user-facing content is extensive across the roster.

## Current corpus

- 89 canonical fighter pages remain represented by the Pro Lab research registry.
- 64 provenance-backed player representatives are cataloged.
- The latest representative additions are Reno (Byleth/Greninja with Sephiroth secondary), AlanDiss (Snake), and zawg (Duck Hunt), broadening several previously thin study pools.
- The top 28 characters / combined character groups in UltRank Half Year 2026 representation all have at least one provenance-backed representative candidate.
- 207 tournament-set learning records are cataloged, including 197 anchored to the 2026 season.
- 72 records now resolve to direct watch/stream URLs. The remaining 135 records are source-index acquisitions whose exact tournament set is discoverable through a public set index but whose direct watch URL still needs resolution.
- 71 distinct direct-footage review units are queued. Source-index records are deliberately excluded from tactical review until their direct video URL is resolved.
- 135 source-index records are tracked separately as a link-resolution queue rather than being falsely counted as footage already ready for direct review.
- KAGARIBI #15 final-day navigation coordinates cover the streamed top-bracket path from Winners Quarterfinals through Grand Finals.
- Fighter VOD libraries index both sides of a recorded matchup, so a cataloged set is discoverable from every confirmed character represented in that set rather than only from the primary study-player side.
- The public VOD library supports search plus tier, era, review-state, and sort controls and labels source-index records separately from direct VOD links.

## Evidence boundary

Metadata acquisition is not tactical analysis. Player tags, character usage, event metadata, bracket rounds, results, VOD URLs, and published stream coordinates may be stored when they are source-backed. A `ProDecisionMoment` may only be added after direct gameplay review verifies the observable state, chosen option, outcome, timestamp, and teaching tags.

A source-index record is one step earlier than a direct VOD record. It establishes a tournament set and gives the user/reviewer a public discovery path, but it does **not** claim that the direct watch URL has already been resolved. Once the exact gameplay-bearing watch URL is resolved, the record enters the direct-review queue; that link-resolution step still does **not** create tactical claims, exact patch claims, or claims about player intent.

Accordingly, the tactical annotation corpus intentionally remains empty. This prevents rankings, page descriptions, bracket results, video titles, or discovery indexes from being transformed into invented player intent or invented in-game decisions.

## 2026 research priority source

`src/data/proLabResearchPriorities.ts` records the top 28 UltRank Half Year 2026 character-representation entries. This metric is tournament game-win representation, not a tier list. It is used only to order research effort.

The final five uncovered top-28 entries were closed with current source-backed representatives:

- Mii Brawler — Yopi
- Roy — Kola
- Greninja — Tarik
- Donkey Kong — Mild na H.O
- Hero — Akakikusu

The current representative corpus additionally includes active specialists and top-level players across regions, with the latest additions Reno, AlanDiss, and zawg.

## Latest VOD expansion

The first extensive-library batch added 19 source-backed 2026 set records from KAGARIBI #15, LVL UP EXPO 2026, and Let's Make BIG Moves 2026.

The second extensive-library batch added 9 source-backed MomoCon 2026 sets and broadened the representative pool.

The third extensive-library batch added 11 records with an explicit thin-character bias, including the first multi-set Isabelle study run.

The fourth acquisition pass changed the cadence from small batches to bulk research and added 89 source-indexed 2026 tournament sets from Patchwork, S Factor X3, Comicpalooza Fight Club, and Supernova.

The fifth acquisition pass adds **61 more source-backed 2026 sets** while also beginning large-scale direct-link resolution:

- The Worst #20 — 12 sets
- Weekly Smash Party #242 — 9 sets
- Battle of BC 8 — 16 sets
- Flash Flood — 9 sets
- DELTA x Seibugeki Open — 6 sets
- Get On My Level 2026 — 6 directly resolved sets
- Patchwork 2026 — 3 additional directly resolved sets

Ten of the 61 new records already have exact YouTube watch targets. Five previously source-indexed Patchwork records were also upgraded to exact YouTube targets, so this pass advances **15 records into direct-footage review readiness** while adding 61 new sets overall.

The batch expands practical current-season coverage for Young Link, Bowser Jr., Duck Hunt, Byleth, Sephiroth, Ice Climbers, Little Mac, Robin, Ike, Mii Brawler, Richter, Olimar, King K. Rool, Pac-Man, Sora, Terry, and many already-covered matchup partners. Unknown exact patch details and tactical interpretation remain unclaimed.

## Acquisition cadence going forward

Future `continue` work should make a substantial corpus dent rather than stop after a handful of records. A useful normal target is roughly 50–100+ source-backed set acquisitions per large research pass when credible sources are available. Bulk acquisition should prioritize low-coverage fighters, multiple tournaments, matchup diversity, and multiple representatives rather than repeatedly padding only the deepest meta-character libraries.

Bulk source indexing is only the acquisition stage. Follow-up passes should resolve direct watch URLs at scale and increasingly combine new acquisitions with direct footage review so the project does not end with hundreds of unreviewed links.

## Next content work

1. Continue bulk acquiring current major/supermajor/superregional sets until every fighter has a genuinely useful library, targeting roughly 12 strong sets as a floor where footage exists and substantially more for well-represented characters.
2. Resolve the 135 remaining source-index records to stable direct watch URLs in large batches; move them into direct-review readiness only after that resolution.
3. Expand each fighter toward 2–5 credible representatives where the competitive record supports them.
4. Prioritize fighters that still have zero/thin coverage rather than repeatedly padding already-deep characters.
5. Review critical 2026 direct VOD targets and record only directly observable decision moments with exact in-video timestamps.
6. Grow the reviewed tactical corpus toward thousands of real moments so lessons, decision exercises, matchup patterns, player comparisons, set breakdowns, frame-data references, and practice actions become genuinely extensive.
7. Keep older historically useful sets explicitly separated from current evidence rather than deleting them.

## Primary public provenance

- UltRank Half Year 2026: https://www.ssbwiki.com/UltRank_Half_Year_2026
- KAGARIBI #15 final-day stream: https://www.youtube.com/watch?v=mVflVyrWS5Y
- KAGARIBI #15 tournament page: https://www.ssbwiki.com/Tournament:Kagaribi_15
- LVL UP EXPO 2026 tournament page: https://www.ssbwiki.com/Tournament:LVL_UP_EXPO_2026
- Let's Make BIG Moves 2026 tournament page: https://www.ssbwiki.com/Tournament:Let%27s_Make_BIG_Moves_2026
- MomoCon 2026 tournament page: https://liquipedia.net/smash/MomoCon/2026
- No Tech Zone 2026 tournament page: https://www.ssbwiki.com/Tournament:No_Tech_Zone_2026
- Maesuma'HIT #165 tournament page: https://www.start.gg/tournament/hit-165-maesuma-hit-165/details
- Patchwork 2026: A Love Letter: https://liquipedia.net/smash/Patchwork/2026
- S Factor X3: https://www.ssbwiki.com/Tournament:S_Factor_X3
- Comicpalooza Fight Club 2026: https://www.ssbwiki.com/Tournament:Comicpalooza_Fight_Club_2026
- Supernova 2026: https://www.ssbwiki.com/Tournament:Supernova_2026
- The Worst #20: https://www.start.gg/tournament/the-worst-20/events
- Weekly Smash Party #242: https://www.start.gg/tournament/weekly-smash-party-242/event/special-1on1-ultimate-singles
- Battle of BC 8: https://liquipedia.net/smash/Battle_of_BC/8/Ultimate
- Flash Flood: https://www.ssbwiki.com/Tournament:Flash_Flood
- DELTA x Seibugeki Open: https://www.ssbwiki.com/Tournament:DELTA_x_Seibugeki_Open
- Get On My Level 2026: https://www.ssbwiki.com/Tournament:Get_On_My_Level_2026
- Public set discovery index: https://www.smash-tube.com/
- Per-player source pages and tournament sources are retained directly on every representative and set record.
