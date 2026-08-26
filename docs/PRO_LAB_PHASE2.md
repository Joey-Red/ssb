# Phase II — Competitive Decision Lab / Pro VOD Learning System

Phase I (M01–M70) established the training, frame-data, and visual-study foundation. Phase II turns real competitive tournament footage into structured learning material without converting the production site into an AI service or inventing player intent.

The immutable Phase I checkpoint is recorded in [`PHASE1_CHECKPOINT.md`](PHASE1_CHECKPOINT.md).

## Product boundary

The production application remains a frontend-only GitHub Pages SPA. Pro Lab data is researched, reviewed, and generated ahead of deployment, then shipped as static structured data. There is no account requirement, telemetry, runtime AI service, or required runtime API.

Tournament footage remains with its publisher. The project stores public source URLs, timestamps, factual tournament metadata, and original educational analysis. It does not redistribute full VOD files. External videos are explicit user-opened references unless a later milestone deliberately revises that policy.

### Evidence rules

- A visible action or result can be labeled **observed**.
- A tactical explanation can be labeled **strong inference** or **reasonable inference**.
- **Speculative** interpretations are not eligible for default teaching material.
- Wording such as “likely,” “may,” and “suggests” is required when describing inferred motivation.
- The project never claims to know what a player was thinking unless the player explicitly stated it in a source.
- Plausible alternatives are teaching prompts, not claims that another choice was objectively correct.
- Unknown bracket, patch, opponent-character, or timing metadata remains unknown rather than being guessed.
- Cross-VOD patterns require repeated reviewed evidence from multiple sets before they are surfaced as a pattern.

## M71–M90 roadmap

### M71 — Freeze the Phase I release ✅
Record the exact production commit, successful Pages deployment, visual-coverage state, integrity rules, and a recovery branch before Phase II work begins.

**Delivered:** `docs/PHASE1_CHECKPOINT.md` plus `checkpoint/phase1-training-frame-data-complete` at the Phase I production head.

### M72 — Build the pro-player research registry ✅
Create a typed representative-player registry, character role model (`main | co-main | secondary`), active/legacy distinction, provenance URLs, and a research state for every canonical fighter.

**Delivered:** all 89 fighters have an explicit Pro Lab research state. The pilot has provenance-backed representatives including Shuton, Sparg0, Light, Kaninabe, Sisqui, Yaura, Hero, LeoN, MuteAce, and Umeki. Unresearched fighters remain `research-queued` rather than receiving guessed representatives. Full-roster representative depth is an M89 expansion task.

### M73 — Establish VOD quality and provenance rules ✅
Prefer organized competition, complete/readable sets, stable tournament/broadcast sources, confirmed character use, known era where possible, and retained provenance. Score candidate VODs consistently without inflating unknown metadata.

**Delivered:** `proLabPolicy.ts` contains weighted rules, minimum quality thresholds, interpretation policy, copyright boundary, and runtime-networking policy.

### M74 — Create the static VOD catalog ✅
Store player, fighter, opponent, opponent character where verified, tournament, event tier, date, round where verified, video URL/ID, game era, result where verified, source URLs, analysis state, and quality assessment.

**Delivered:** the first catalog contains nine real tournament sets spanning LVL UP EXPO 2025, Get On My Level: Forever, DELTA #10, Weekly Smash Party #187, UltCore Third, Smash Valley: Revival, and Patchwork 2025.

### M75 — Define the analysis schema ✅
Create reusable contracts for VODs, set breakdowns, game state, contexts, recurring patterns, provenance, and teaching tags before mass annotation starts.

**Delivered:** `proLabTypes.ts` defines the static analysis contracts; `proLab.ts` provides the shared analysis operations.

### M76 — Define a decision moment ✅
A decision moment records the exact VOD/game/timestamp, visible game state, context, chosen option, observable outcome, possible alternatives, teaching tags, and optional interpretation.

**Delivered:** `ProDecisionMoment` and `DecisionGameState` enforce this separation structurally.

### M77 — Add confidence and evidence scoring ✅
Separate observation from inference and prevent speculative notes from silently becoming instruction.

**Delivered:** four evidence classes are supported. Default teaching eligibility rejects `speculative` moments and requires confidence >= 0.65. Tests enforce the boundary.

### M78 — Build the first multi-archetype pilot ✅
Exercise the model on strategically different fighters before scaling to the entire roster.

**Delivered pilot:** Pyra, Mythra, Fox, Samus, Dark Samus, Bowser, Peach, and Daisy. This covers sword/stance play, rushdown, projectile zoning, heavyweight play, and float-based pressure. Every pilot fighter has at least one provenance-backed tournament VOD in the catalog.

### M79 — Build the full-set breakdown system ✅
Represent a set as a sequence of reviewed teaching moments and per-game summaries while refusing to synthesize analysis for footage that has not actually been reviewed.

**Delivered:** `buildSetBreakdown()` produces structured breakdowns from eligible decision moments. Every cataloged pilot set currently receives an explicit `queued` breakdown because tactical gameplay annotations have not yet been visually reviewed; zero fake decisions, habits, or adaptations are generated to make the feature look populated.

### M80 — Build the cross-VOD pattern extractor ✅
Aggregate repeated reviewed moments into fighter/context/teaching-tag patterns only after evidence appears across multiple VODs.

**Delivered:** `extractProPatterns()` groups eligible reviewed annotations, counts distinct sets, tracks evidence moment IDs/player IDs, averages confidence, rejects speculation, and defaults to a minimum of two occurrences across two VODs. Synthetic unit fixtures verify the algorithm without pretending those fixtures describe real players.

### M81 — Convert reviewed patterns into character lessons
Add fighter-level learning summaries: top-player priorities, neutral, advantage, disadvantage, ledgetrapping, recovery, stock closing, adaptations, and beginner-vs-pro differences. Every statement must remain traceable to reviewed evidence.

### M82 — Add “What would you do?” decision training
Pause at a reviewed competitive moment, present only the information available before the decision, ask the learner to choose among plausible options, then reveal the pro’s actual choice, observed result, and evidence-scored explanation.

### M83 — Connect Pro Lab to frame data
Where a decision depends on startup, shield advantage, OOS speed, landing lag, or another documented numeric property, link the lesson directly to the existing frame-data source instead of restating unsupported numbers.

### M84 — Convert lessons into Practice Mode drills
Allow a reviewed lesson to create a local practice drill with fighter, setup, action route, notes, target reps, and teaching objective using the existing drill system.

### M85 — Add matchup-specific analysis
Separate character-wide patterns from opponent-character/matchup-specific adaptations. Require enough reviewed evidence before describing a behavior as matchup-specific.

### M86 — Add player comparison
Compare multiple elite representatives of the same fighter so one player’s style is not presented as the only correct way to use the character.

### M87 — Add temporal and patch awareness
Attach lessons to event date/game era, prefer current evidence by default, and retain older sets as explicitly labeled legacy material.

### M88 — Add maintenance automation
Audit dead/private links, duplicate sets, missing provenance, old evidence, fighters lacking recent sets, player/main changes, and catalog integrity without adding production runtime networking.

### M89 — Expand to the full 89-fighter roster and run QA
Research multiple credible representatives where the competitive record supports them, collect high-quality sets, review annotations, enforce minimum evidence thresholds, and identify fighters where the available competitive corpus is genuinely sparse.

### M90 — Release Pro Lab
Ship Pro Lab as a first-class learning area: fighter → players → sets → breakdown → decision exercises → pattern lessons → practice drills, with mobile/desktop accessibility, static-data validation, release QA, and GitHub Pages deployment.

## Pilot source set

The initial catalog intentionally starts small enough to review deeply rather than bulk-importing low-quality links:

- Shuton vs. Nomed — LVL UP EXPO 2025 — Pyra/Mythra.
- Sparg0 vs. BeastModePaul — Get On My Level: Forever — Pyra/Mythra vs. Hero.
- Light vs. Raru — LVL UP EXPO 2025 — Fox vs. Luigi.
- Light vs. Wildz — Get On My Level: Forever — Fox vs. Kazuya.
- Yaura vs. Shuton — DELTA #10 — Samus vs. Olimar.
- Yaura vs. Umeki — Weekly Smash Party #187 — Dark Samus vs. Daisy.
- Hero vs. Tora — UltCore Third — Bowser; opponent character remains intentionally unspecified until verified.
- LeoN vs. Beast — Smash Valley: Revival — legacy Bowser study.
- MuteAce vs. Peabnut — Patchwork 2025 — Peach vs. Mega Man.

## Current Phase II status

**M71–M80 are implemented on the Phase II foundation branch.** The first ten milestones deliberately establish trustworthy data, source, analysis, and aggregation infrastructure before the site begins making tactical claims about real players. Actual decision annotations remain review-queued until the footage itself can be inspected; metadata alone is never treated as gameplay analysis.
