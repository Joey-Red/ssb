# Pro Lab long-term completion plan

Reference direction: 2026-08-26

This document is the controlling content plan for future Pro Lab work. A completed implementation milestone does **not** mean the Pro Lab is feature-complete. The Pro Lab remains incomplete until its user-facing evidence, VOD, teaching, matchup, decision, and player-comparison coverage is extensive across the roster.

## Completion doctrine

Do not stop because a milestone number, release checkpoint, or technical scaffold is complete. Continue expanding the Pro Lab until opening essentially any of the 89 fighter workspaces presents substantial, useful competitive-study material.

The priority order is:

1. acquire extensive, source-backed tournament VOD coverage;
2. broaden credible player representatives per fighter;
3. directly review gameplay and record real decision moments;
4. use those reviewed moments to populate lessons, decision exercises, matchup patterns, player comparisons, set breakdowns, frame-data links, and practice drills;
5. keep the corpus current while retaining useful legacy footage with explicit era labels;
6. improve the UI as necessary to make a corpus of hundreds or thousands of records usable.

Generic scaffolding is secondary to real content unless new scaffolding is required to support the growing corpus.

## VOD library target

The current dozens-of-sets corpus is only an initial seed. The intended library is **hundreds of high-quality tournament sets**, eventually reaching roughly **12 strong sets per fighter as a floor where credible footage exists**, with **20–30+ or more** for competitively common characters and specialists with abundant footage.

Rules:

- Prefer current major/supermajor footage, then strong regionals and historically useful legacy sets.
- Every fighter should have meaningful footage, not merely one token set.
- A set may be discoverable from every confirmed character represented in the matchup.
- Preserve event, date, round, player, opponent, characters, result when sourced, video URL, set-start coordinate when needed, provenance sources, quality status, era, and review state.
- Do not invent character usage, exact patch, round, result, or set timing when not verified.
- Rare characters may legitimately have fewer sets if strong footage is genuinely scarce; do not lower quality merely to satisfy a number.
- Keep old footage when pedagogically valuable, but label it current/recent/legacy rather than presenting all eras as equivalent.

## Player-representative target

A single professional must not define an entire character when the competitive record supports alternatives.

Target **2–5 credible high-level representatives per fighter where possible**, including different play styles, regions, and eras when useful. Character role must remain explicit (`main`, `co-main`, `secondary`) and source-backed. Player status must distinguish active and legacy representatives.

## Reviewed decision-moment corpus

This is the largest unfinished content area and the core of the Pro Lab.

The production tactical corpus should grow from zero/sparse reviewed moments into **thousands of real, timestamped observations** across the roster. Important fighters and well-covered sets should eventually have dozens of useful moments each.

Each reviewed moment must be based on direct footage review and should record, where observable:

- exact VOD and timestamp;
- game number;
- fighter and opponent context;
- stocks and percents when reliably readable;
- stage/position/resources when relevant;
- decision context (`neutral`, `advantage`, `disadvantage`, `ledge`, `recovery`, `tech-chase`, `shield-pressure`, `punish`, `kill-setup`, `resource-management`, `adaptation`);
- chosen option;
- observable outcome;
- plausible alternatives only when defensible;
- teaching tags;
- evidence class and confidence;
- interpretation only when supported by evidence;
- frame-data references only when the exact committed move row is relevant.

Never infer player intent from a video title, bracket result, ranking, matchup reputation, or metadata. If intent is not observable, describe the observable choice/outcome rather than inventing a reason.

## Set breakdown target

Important tournament sets should become educational studies rather than simple links. Build game-by-game breakdowns from reviewed evidence with pivotal moments, recurring habits, adaptation between games, matchup-specific changes, stock-closing decisions, and other observable progression.

Unreviewed sets remain queued. A set does not become “analyzed” simply because its metadata is complete.

## Character lesson target

Every fighter should eventually have substantial evidence-backed lessons covering as many of these areas as the reviewed corpus supports:

- top-player priorities;
- neutral;
- advantage;
- disadvantage;
- ledgetrapping;
- recovery;
- stock closing;
- adaptation;
- beginner-vs-pro differences.

Character-wide statements require repeated evidence. Do not promote one player’s isolated choice into a universal character rule.

## “What would you do?” target

This should become a large interactive decision-training bank for every well-covered fighter.

Target many exercises per fighter across neutral, advantage, disadvantage, ledge, recovery, landing, tech situations, shield pressure, punishes, kill setups, resource choices, defensive choices, and matchup-specific situations.

The user must choose before the professional option is revealed. The reveal should show the observed pro choice, observable result, appropriately qualified explanation, evidence/confidence, exact VOD location, relevant frame-data references when applicable, and the option to convert the situation into a local drill.

No synthetic tournament decisions should be shipped as filler.

## Matchup-analysis target

Build real matchup-specific pattern libraries from repeated opponent-tagged reviewed evidence.

Prioritize common meta opponents and difficult/frequent matchups first, but continue broadening. Matchup claims should require repeated evidence across multiple moments/sets and ideally multiple representatives before being treated as character-wide.

The eventual goal is useful evidence for a large portion of practical matchups, not an unsupported 89×89 matchup chart.

## Player-comparison target

For fighters with multiple representatives, compare elite styles only after enough reviewed evidence exists for each player. Surface repeated differences such as preferred neutral tools, defensive choices, ledge behavior, resource use, advantage-state routing, risk tolerance, and recurring matchup solutions, with direct supporting moments beneath the comparison.

Do not manufacture differences merely because two players are known for different reputations.

## Training-system integration target

Reviewed Pro Lab content should connect to the rest of Smash Forge:

- exact fighter guide;
- all-moves playback library;
- relevant frame-data row and frame viewer;
- matchup material;
- local custom drill creation;
- practice mode when a reviewed situation can be represented honestly as a repeatable setup.

The final experience should feel like one training system rather than a VOD list attached to a separate page.

## Large-corpus UX target

As the corpus grows, expand browsing so hundreds/thousands of records remain usable. Support filtering/search by fighter, player, opponent, matchup, event, date/year, event tier, current/recent/legacy era, reviewed/unreviewed status, teaching context/tag, and other useful evidence states. Provide sensible sorting, recommended-study sets, and clear coverage indicators.

Do not expose internal milestone identifiers in the public UI.

## Coverage and maintenance target

Track internally, per fighter:

- representative count and active representative count;
- total VOD count and current-season/current-era count;
- reviewed-set count;
- reviewed-moment count;
- lesson-topic coverage;
- decision-exercise count;
- matchup coverage;
- player-comparison readiness;
- missing-content gaps.

Continue adding recent major/supermajor footage over time, update player character roles when they change, preserve useful historical evidence as legacy, audit dead/private links, and keep provenance attached to every record.

## Other unfinished project work after Pro Lab priority

These remain real project work but are lower priority than extensive Pro Lab content unless explicitly reprioritized:

- substantially expand manually/source-reviewed hitbox, hurtbox, grab, and intangibility overlay geometry;
- continue optional exact/action-specific visual upgrades where evidence supports them;
- broad real-device QA across phones/tablets/laptops/2K/4K/ultrawide displays;
- repository/public-release polish such as metadata, branch protection, release tagging, and an explicit license decision.

## Definition of Pro Lab “extensive”

The Pro Lab is not extensive merely because its architecture works or every fighter has a page. It is extensive when most fighters have a meaningful VOD library, credible representatives, reviewed tactical examples, useful lessons and decision exercises, practical matchup evidence, and player-style analysis where the competitive record permits it.

Future work should therefore bias heavily toward **content acquisition + direct footage review + evidence-backed teaching output**. Continue iterating until the actual user-facing depth, not the milestone count, makes the feature feel complete.