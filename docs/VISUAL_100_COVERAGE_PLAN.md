# SSBU Training Festival — 100% Visual Coverage Execution Plan

## Objective
Reach a truthful, reproducible **100% visual study dataset** for the complete Super Smash Bros. Ultimate roster. Every mapped move/visual variant must have a complete, source-backed timeline appropriate to what the variant actually represents: fighter animation, landing animation, projectile/object, charge state, travel state, counter state, throw state, transformation, loop, or other separately timed sequence.

The finish line is not “every source has the same number of images as Total Frames.” The finish line is:

- every documented fighter action has continuous startup → active → recovery coverage;
- every auxiliary animation/object is represented on its own truthful timeline instead of being forced onto the parent move timeline;
- every active frame has source-backed hitbox/grabbox/interaction visualization where that interaction exists;
- held poses are represented for as many game frames as the source timing actually holds them;
- no frame, pose, hitbox, Total Frames value, or source-to-game mapping is invented;
- every runtime-loaded asset remains vendored/same-origin and GitHub Pages safe;
- the generated residual coverage report reaches **zero unresolved gaps**.

## Current baseline
The release immediately before this plan contains:

- 89 fighter pages;
- 2,580 mapped moves;
- 3,075 visual variants;
- 2,327 `full` exact variants;
- 398 `partial` exact variants;
- 168 `untimed-animation` variants;
- 182 `static`/separately timed variants;
- 748 reported non-full variants total.

These 748 entries are **not necessarily 748 missing moves**. Many are landing references, projectiles, alternate versions, charge states, separately timed objects, or sources whose encoded animation timing has not yet been interpreted. The first goal is therefore to correct the model and reclassify the residual set before manually sourcing/capturing anything.

---

# Definition of 100%

A variant is complete only when it satisfies the rules for its timeline class.

## Fighter-action timeline
A normal attack/action is complete when:

1. frame 1 through the documented final action frame are represented;
2. startup, active, and recovery phases are all continuously viewable;
3. source timing is mapped deterministically to the 60 FPS game timeline;
4. documented active frames agree with the visual hitbox/interaction evidence;
5. no source frame is assigned to an unsupported game frame;
6. the player can step to every game frame in the action;
7. source provenance and mapping method are stored.

## Auxiliary timeline
Landing animations, projectiles, explosions, charge states, thrown objects, Luma actions, Bullet Arts, counters, loop states, travel states, transformations, etc. must not be judged against the parent action's Total Frames unless there is evidence they share that timeline.

Each auxiliary variant must instead have its own:

- timeline class;
- start/end semantics;
- source duration/frame count;
- exact/held/static timing model;
- parent move relationship;
- provenance.

## Exact held/static coverage
A source does **not** need a different bitmap for every game frame to be exact. If animation metadata says one image is displayed for multiple 60 FPS frames, repeating that same source image across those frames is truthful representation of the source duration, not synthesis.

Likewise, a genuinely static projectile/object can be `exact-static` if the object truly remains visually unchanged for the documented interval. Static source material is only a gap when the represented thing should visibly animate but the source cannot show it.

## Interaction/hitbox coverage
For an active or interaction frame, one of the following must exist:

- exact source imagery with the collision visualization already present; or
- reviewed overlay geometry tied to that exact game/source frame.

The app must never draw a hitbox/grabbox/hurtbox/intangibility region on a frame without explicit evidence.

---

# Truth and provenance rules

1. **No invented mappings.** Similar-looking adjacent frames are not enough evidence.
2. **No fake interpolation.** AI-generated/interpolated/in-between frames cannot be used as factual frame-study evidence.
3. **Source display duration is evidence.** GIF/APNG/WebP frame timing may legitimately map one encoded image to multiple game frames.
4. **Total Frames and FAF remain separate.** Neither substitutes for the other.
5. **Auxiliary media gets auxiliary timing.** Landing/projectile/charge/etc. media is not forced onto a fighter-action timeline merely because it appears on the same UFD move card.
6. **Exactness must be reproducible.** Every full mapping records how it was derived.
7. **Unknown remains unknown until researched or captured.** Missing values are not inferred from neighboring moves or echo fighters unless the underlying source explicitly establishes equivalence.
8. **Runtime stays same-origin.** External sources are maintenance/provenance only; production never depends on them automatically.
9. **Respect the existing media/provenance policy.** Do not import unauthorized extracted game assets merely to close a percentage counter.
10. **100% means zero unresolved factual coverage gaps, not zero static images.** A truly static visual can be complete if its timing/state is exact.

---

# Source hierarchy

For every unresolved timing/visual question, use this order:

1. committed project frame snapshot / currently trusted factual data;
2. Ultimate Frame Data source material and metadata;
3. sources credited by or directly corroborating the existing dataset;
4. other reputable measured SSBU frame/hitbox references that can be cross-checked;
5. deterministic project-owned/user-provided game capture for anything still unresolved.

When sources conflict:

- do not silently choose one;
- record the disagreement;
- prefer measured/reproducible evidence;
- require corroboration or a deterministic capture before promoting the result to exact.

---

# Implementation strategy

The work is pipeline-first, not character-first.

Fixing the source timing model and auxiliary timeline model across all 3,075 variants comes before manual fighter cleanup. This prevents hundreds of one-off patches and should automatically resolve many variants currently reported as 1–3 images short.

After the automated/modeling passes, the remaining set is worked down by category and character until zero remains.

---

# Milestones

## Phase 8 — 100% visual coverage

### M71 — Coverage taxonomy and authoritative audit

**Goal:** turn the current 748-item residual report into a precise work inventory rather than one generic “gap” bucket.

Work:

- regenerate the full 89-fighter visual report from the current production pipeline;
- give every variant an explicit timeline class such as:
  - `fighter-action`;
  - `landing`;
  - `projectile`;
  - `explosion`;
  - `charge`;
  - `travel`;
  - `loop`;
  - `counter`;
  - `throw`;
  - `grab`;
  - `transformation`;
  - `companion`;
  - `other`;
- distinguish primary move coverage from auxiliary/alternate coverage;
- generate per-character and per-reason counts;
- create an authoritative unresolved manifest with machine-readable reason codes;
- identify all “almost full” cases where encoded image count differs from Total Frames by only a few frames;
- identify all variants with `Total Frames = null`;
- identify all variants where a static reference is likely legitimate rather than incomplete.

**Exit criteria:**

- all 3,075 variants classified;
- no generic/ambiguous gap reason remains;
- every unresolved variant has a next-action category;
- report can answer “what is still incomplete?” by fighter, move, variant, reason, and timeline class.

---

### M72 — Timing-aware animation decoding

**Goal:** stop equating encoded image count with game-frame count.

Work:

- preserve per-frame duration/delay metadata while decoding GIF/APNG/animated WebP sources;
- normalize animation timing onto a rational 60 FPS game-frame timeline;
- support one source image spanning multiple game frames when the source duration explicitly holds it;
- preserve source disposal/blend semantics where required for correct rendered frames;
- record the timing conversion/mapping alongside generated media metadata;
- reject mappings whose total duration cannot be reconciled with the documented move timeline;
- anchor/validate mappings against known active-frame ranges where possible;
- add deterministic tests for duration rounding and cumulative drift;
- ensure repeated displayed frames are represented as source-held frames rather than synthesized images.

Special attention goes first to near-complete cases such as 36/37, 55/56, 56/57, 64/65, etc., because many may become fully exact once encoded display duration is interpreted correctly.

**Exit criteria:**

- decoder exposes source frame durations;
- 60 FPS mapping is deterministic and tested;
- no cumulative timing drift across long animations;
- all 3,075 variants are regenerated through the timing-aware path;
- coverage report shows the exact number of gaps eliminated by correct timing interpretation.

---

### M73 — Independent auxiliary timelines

**Goal:** stop falsely treating landing/projectile/alternate/reference media as if it must cover the parent move's entire Total Frames value.

Work:

- extend visual metadata with timeline scope/class;
- give auxiliary variants independent timing metadata;
- represent parent/child relationships explicitly;
- support separately timed landing animations;
- support projectiles/explosions/objects with independent lifetimes;
- support charge loops and release states;
- support counters and success/failure branches;
- support companion actions such as Luma independently from Rosalina when appropriate;
- support alternate states such as Bullet Arts, item/projectile forms, aerial/ground branches, etc.;
- allow `exact-static` only when the represented state is truthfully static;
- update the viewer so selecting an auxiliary variant shows its own timeline and labels instead of misleading parent-frame numbers.

**Exit criteria:**

- auxiliary variants no longer inherit parent Total Frames without evidence;
- legitimate static/separately timed references are reclassified accurately;
- landing/projectile/charge/etc. sources are usable as first-class frame-study timelines;
- no runtime label implies a source is synchronized to a parent action when it is not.

---

### M74 — Full-roster automated reconstruction pass

**Goal:** extract every exact mapping that can be obtained automatically from existing source material after M72/M73.

Work:

- regenerate all 89 fighter indexes and all 3,075 variants;
- promote timing-resolved variants to exact full coverage;
- promote legitimate static states to exact-static rather than unresolved;
- retain partial mappings only when source evidence genuinely ends early/starts late;
- regenerate same-origin media;
- preserve media-size budget and lazy per-fighter loading;
- produce before/after coverage statistics;
- generate a new residual manifest containing only variants that still require factual research, replacement source material, or new capture.

**Exit criteria:**

- every automatically resolvable variant is exact;
- residual set is materially smaller than the Phase 7 748-variant baseline;
- no manual fix is used where the generalized pipeline can solve the same class of problem.

---

### M75 — Missing timing metadata research

**Goal:** resolve `untimed-animation` variants and any other sources lacking trustworthy action duration.

Work:

- research every residual variant with missing total/timeline duration;
- record source citation/provenance for each recovered timing value;
- distinguish duration of fighter action from duration of projectile/landing/loop/etc.;
- resolve echo/alternate-character equivalence only where a source explicitly supports it;
- add structured confidence/provenance fields;
- require corroboration when sources disagree;
- move irreducible entries to a `capture-required` queue instead of guessing.

**Exit criteria:**

- no variant remains `untimed` merely because the pipeline never looked for its timing;
- every unresolved timing value has an explicit reason and capture/research request;
- researched timing values are source-backed and validation-tested.

---

### M76 — Source augmentation and replacement

**Goal:** replace genuinely incomplete visual sources with better truthful sources where available.

Work:

- audit the residual `partial` set after M74/M75;
- find alternate source animations/captures that contain the missing startup/recovery/branch frames;
- compare candidate sources against known active frames and documented timing;
- prefer full-sequence measured/captured sources over stitched guesses;
- preserve source provenance for each replacement;
- never combine unrelated animations merely to manufacture apparent continuity;
- only retain third-party material when it is compatible with the project's existing media/provenance policy;
- regenerate exact local media from accepted replacements.

**Exit criteria:**

- all publicly/source-resolvable residual variants are closed;
- remaining queue contains only cases for which no adequate truthful source exists or where independent capture is required.

---

### M77 — Deterministic capture lane for hard cases

**Goal:** close every remaining source hole with reproducible project-owned/user-provided captures rather than accepting permanent incompleteness.

For each remaining variant, generate a capture request containing:

- fighter;
- move/variant;
- ground/air/state prerequisites;
- charge/input/state requirements;
- frame/timeline target;
- whether hitboxes/grabboxes/etc. must be visible;
- whether a clean animation reference is also useful;
- known active frames and expected action duration;
- capture naming convention;
- verification checklist.

Capture protocol:

- use a deterministic training/frame-advance environment where practical;
- begin before action frame 1 and capture through the complete end state;
- preserve one-to-one frame advancement or otherwise demonstrably lossless timing;
- avoid variable-frame-rate recordings for factual frame mapping;
- preserve original captures before resizing/packing;
- use the same camera/zoom/reference framing for a sequence when practical;
- capture all meaningful branches/charge levels/forms separately;
- include collision visualization when required for interaction verification;
- record game/build/version/environment metadata with the capture.

If this phase requires game-side capture that cannot be performed from GitHub automation, the repo will generate the exact smallest possible request list for manual capture. Once those captures are supplied, all processing, mapping, validation, vendoring, and integration returns to the normal automated pipeline.

**Exit criteria:**

- `capture-required` queue is zero;
- every previously source-less/insufficient variant has a reproducible complete capture;
- raw-source provenance remains traceable from runtime metadata.

---

### M78 — 100% interaction/hitbox verification

**Goal:** make the visual study complete not just in character motion, but in actual collision/interaction evidence.

Work:

- audit every active/interaction frame across the exact timeline set;
- verify hitbox imagery appears only on frames documented as active for that interaction;
- verify grabbox/command-grab frames separately from attack hitboxes;
- verify counter/reflector/intangibility/hurtbox states where source data supports them;
- keep baked source visualization and editable project overlays conceptually separate;
- where overlay geometry exists, ensure it is tied to exact source/game frame IDs;
- where only baked collision visualization exists, identify it as source visualization rather than fabricated editable geometry;
- validate multi-hit gaps so inactive frames between hit windows do not display continuous attack boxes;
- audit throws/projectiles/companions as independent interaction timelines where appropriate.

**Exit criteria:**

- every active interaction frame has source-backed collision evidence;
- no inactive frame displays unsupported attack/grab geometry;
- no overlay exists without exact frame provenance;
- automated validators catch active-span/collision mismatches.

---

### M79 — Zero-gap CI gate, performance, and integrity hardening

**Goal:** make 100% coverage a permanent invariant rather than a one-time cleanup.

Add/strengthen CI so the release fails if any of the following occurs:

- unresolved coverage count > 0;
- unclassified timeline scope;
- missing timeline duration where one is required;
- duplicate fighter/move/variant ID;
- broken local media path;
- missing per-fighter visual index;
- out-of-range source/game-frame mapping;
- non-monotonic mapping;
- unexplained duration mismatch;
- unsupported collision overlay;
- automatic third-party runtime request;
- stale generated coverage metadata;
- full-roster count drift without explicit review;
- media artifact exceeds the agreed Pages/performance budget;
- runtime player cannot load/seek representative variants.

Target generated summary after schema migration:

```text
fighters: 89
mappedMoves: 2580 (or newer audited canonical count)
variantCount: audited canonical count
unresolvedVariants: 0
unresolvedMoves: 0
captureRequired: 0
unclassifiedTimelines: 0
brokenMedia: 0
thirdPartyRuntimeRequests: 0
```

The exact count of variants may legitimately change as auxiliary sources are split/merged correctly. CI should verify against an audited canonical manifest rather than blindly freezing 3,075 forever.

**Exit criteria:**

- `npm run check` includes the zero-gap gate;
- generated residual report is empty;
- full production build remains within media/performance constraints;
- offline/same-origin behavior remains intact.

---

### M80 — Final roster audit, release, merge, and Pages deployment

**Goal:** certify and ship the 100% dataset.

Manual QA matrix must include at minimum:

- simple single-hit normal;
- multi-hit normal;
- aerial with landing animation;
- command grab/grab;
- throw;
- projectile;
- projectile explosion;
- charge move;
- looping move;
- counter/reflector;
- transformation/swap;
- companion-controlled move;
- special with no single fixed action duration;
- ground/air alternate;
- very long action;
- move with multiple source variants;
- Pyra/Mythra representative cases;
- Mr. Game & Watch / Min Min / Rosalina-Luma representative complex cases.

Validate on:

- phone-size viewport;
- desktop 1080p;
- large 2K display;
- ultrawide;
- keyboard-only navigation;
- touch/coarse pointer;
- reduced motion;
- Arena and Festival themes.

Release process:

1. freeze generated visual dataset;
2. run discovery/vendor generation from clean checkout;
3. verify reproducibility/no unexpected diff;
4. run exact-head `npm run check`;
5. review zero-gap report;
6. merge feature PR to `main`;
7. run `main` quality gate;
8. deploy Pages;
9. verify public site against the exact merged SHA;
10. remove stale working branches after successful deployment.

**Exit criteria:**

- zero unresolved variants;
- zero unresolved moves;
- exact-head CI green;
- `main` CI green;
- Pages deployment green;
- public site verified live;
- plan marked complete with final audited counts.

---

# Work ordering after the pipeline passes

Once M72–M74 have eliminated everything they can automatically, remaining work is processed in this order:

1. near-complete fighter actions (small timing discrepancy);
2. missing Total Frames / untimed fighter actions;
3. incorrectly parent-timed auxiliary variants;
4. alternate public/source replacements;
5. projectiles/objects/explosions;
6. charge/loop/branch-heavy specials;
7. companion/form-specific actions;
8. deterministic captures for the true hard cases;
9. interaction/hitbox completeness audit.

Within each category, group by fighter so each character can be certified as complete and removed from the residual roster list.

---

# Tracking and reporting

The generated audit must produce both machine-readable and human-readable views.

## Machine-readable

For every unresolved entry:

```ts
{
  fighterId,
  moveId,
  variantId,
  timelineClass,
  coverageState,
  sourceFrameCount,
  sourceDuration,
  mappedGameFrames,
  expectedGameFrames,
  reasonCode,
  nextAction,
  provenance,
  captureRequestId?
}
```

## Human-readable

Produce:

- total progress percentage;
- full/exact count;
- unresolved variant count;
- unresolved unique move count;
- counts by fighter;
- counts by reason;
- counts by next action;
- characters already certified 100%;
- exact list of remaining manual-capture requests.

Progress should always be expressed as factual counts, not an estimate such as “almost done.”

---

# Character certification rule

A character may be labeled **100% visual coverage** only when:

- every canonical mapped move has complete fighter-action coverage where applicable;
- every registered auxiliary variant has a truthful exact/separately timed representation;
- no unresolved/capture-required variant remains for that fighter;
- active interaction frames have source-backed collision evidence;
- all media is local and loadable;
- fighter-specific validation passes.

This allows the project to report progress character-by-character while the global 100% effort continues.

---

# Expected user involvement

The pipeline, research, source processing, repo changes, tests, generation, CI, merge, and deployment should be handled without requiring routine manual work.

The only likely user-side requirement is **M77**, and only for variants that cannot be truthfully completed from available source material. In that case the repo must first reduce the requirement to an exact, finite capture checklist. The user should never be asked to manually investigate hundreds of variants that the automated pipeline can resolve.

---

# Final acceptance statement

Phase 8 is complete only when the project can truthfully say:

> Every canonical SSBU fighter/move visual study in the application has a complete, source-backed timeline appropriate to the action or auxiliary state it represents. Startup, active, recovery, landing/branch/object states and interaction frames are represented without invented timing or geometry; no unresolved coverage entries remain; all production media is local; and the zero-gap quality gate passes on the exact GitHub Pages release.
