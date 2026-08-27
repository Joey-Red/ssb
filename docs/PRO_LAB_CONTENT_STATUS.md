# Pro Lab content status

Reference date: 2026-08-26

The controlling completion target is documented in `docs/PRO_LAB_LONG_TERM_PLAN.md`. Technical milestone completion does not mean the Pro Lab is feature-complete; future work should continue until actual user-facing content is extensive across the roster.

## Current corpus

- 89 canonical fighter pages remain represented by the Pro Lab research registry.
- 61 provenance-backed player representatives are cataloged.
- The representative pool now includes ApolloKage, Wrath, Dany, Lui$, elijmin, Beastly, Lima, WaKa, and Jakarot in addition to the previously cataloged current and legacy specialists.
- The top 28 characters / combined character groups in UltRank Half Year 2026 representation all have at least one provenance-backed representative candidate.
- 146 tournament-set learning records are cataloged, including 136 anchored to the 2026 season.
- 57 records currently resolve to direct watch/stream URLs. The remaining 89 new records are source-index acquisitions whose exact tournament set is discoverable through a public set index but whose direct watch URL still needs resolution.
- 56 distinct direct-footage review units remain queued. Source-index records are deliberately excluded from tactical review until their direct video URL is resolved.
- 89 source-index records are therefore tracked separately as a link-resolution queue rather than being falsely counted as footage already ready for direct review.
- KAGARIBI #15 final-day navigation coordinates cover the streamed top-bracket path from Winners Quarterfinals through Grand Finals.
- Fighter VOD libraries index both sides of a recorded matchup, so a cataloged set is discoverable from every confirmed character represented in that set rather than only from the primary study-player side.
- The public VOD library supports search plus tier, era, review-state, and sort controls and now labels source-index records separately from direct VOD links.

## Evidence boundary

Metadata acquisition is not tactical analysis. Player tags, character usage, event metadata, bracket rounds, results, VOD URLs, and published stream coordinates may be stored when they are source-backed. A `ProDecisionMoment` may only be added after direct gameplay review verifies the observable state, chosen option, outcome, timestamp, and teaching tags.

A source-index record is one step earlier than a direct VOD record. It establishes a tournament set and gives the user/reviewer a public discovery path, but it does **not** claim that the direct watch URL, upload channel, exact set-day timestamp, or gameplay readability has already been verified. These records stay `cataloged` and enter the direct-review queue only after link resolution.

Accordingly, the tactical annotation corpus intentionally remains empty. This prevents rankings, page descriptions, bracket results, video titles, or discovery indexes from being transformed into invented player intent or invented in-game decisions.

## 2026 research priority source

`src/data/proLabResearchPriorities.ts` records the top 28 UltRank Half Year 2026 character-representation entries. This metric is tournament game-win representation, not a tier list. It is used only to order research effort.

The final five uncovered top-28 entries were closed with current source-backed representatives:

- Mii Brawler — Yopi
- Roy — Kola
- Greninja — Tarik
- Donkey Kong — Mild na H.O
- Hero — Akakikusu

Previously added 2026 coverage includes acola, Doramigi, Hurt, Sonix, Zomba, Miya, Peabnut, MkLeo, Asimo, Raru, Tweek, Yoshidora, ShinyMark, KEN, Glutonny, Sin, Syrup, MASA, Raflow, Ouch!?, Tea, Karaage, Snow, Raki, BeastModePaul, Jahzz0, Jakal, Fatality, Cosmos, Kirb0, Peanut, Lucky (Minnesota), Tux, Furararamen, Kikuzakari, Peppino, Lancelot, ApolloKage, Wrath, Dany, Lui$, elijmin, Beastly, Lima, WaKa, and Jakarot.

## Latest VOD expansion

The first extensive-library batch added 19 source-backed 2026 set records from KAGARIBI #15, LVL UP EXPO 2026, and Let's Make BIG Moves 2026.

The second extensive-library batch added 9 source-backed MomoCon 2026 sets and broadened the representative pool.

The third extensive-library batch added 11 records with an explicit thin-character bias, including the first multi-set Isabelle study run.

The fourth acquisition pass changes the cadence from small batches to bulk research and adds **89 source-indexed 2026 tournament sets in one pass**:

- Patchwork 2026: A Love Letter — 42 sets
- S Factor X3 — 25 sets
- Comicpalooza Fight Club 2026 — 14 sets
- Supernova 2026 — 8 sets

The batch substantially widens matchup and character discovery for Shulk, Wii Fit Trainer, Richter, King K. Rool, Palutena, Bayonetta, Luigi, Villager, Toon Link, Sheik, Daisy, Inkling, Captain Falcon, Terry, Mega Man, Diddy Kong, Sonic, Wolf, Samus, Snake, Roy, Fox, Game & Watch, and additional already-covered characters. It does not pretend that a search/index page is the direct VOD. The app labels these entries as source indexes and keeps their direct-link resolution separate from tactical footage review.

## Acquisition cadence going forward

Future `continue` work should make a substantial corpus dent rather than stop after a handful of records. A useful normal target is roughly 50–100+ source-backed set acquisitions per large research pass when credible sources are available. Bulk acquisition should prioritize low-coverage fighters, multiple tournaments, matchup diversity, and multiple representatives rather than repeatedly padding only the deepest meta-character libraries.

Bulk source indexing is only the acquisition stage. Follow-up passes should resolve direct watch URLs at scale and then increasingly combine new acquisitions with direct footage review so the project does not end with hundreds of unreviewed links.

## Next content work

1. Continue bulk acquiring current major/supermajor/superregional sets until every fighter has a genuinely useful library, targeting roughly 12 strong sets as a floor where footage exists and substantially more for well-represented characters.
2. Resolve the 89 source-index records to stable direct watch URLs in large batches; move them into direct-review readiness only after that resolution.
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
- Public set discovery index: https://www.smash-tube.com/
- Per-player source pages and tournament sources are retained directly on every representative and set record.
