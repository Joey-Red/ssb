# Pro Lab roster coverage

The original 800-record VOD acquisition/recovery corpus is a frozen historical baseline. New source-backed footage that closes fighter coverage gaps is appended through `proLabVodsCoverageGaps.ts` and contributes to the live Pro Lab corpus without changing that completed baseline.

Coverage priority is roster-neutral. The shared coverage work queue determines review allocation from evidence state; there is no pilot character, preference boost, or hard-coded fighter priority. `proZeroVodFighterIds` is derived from the live corpus so unresolved fighters remain explicit until a direct, source-backed competitive VOD is added.

A cataloged VOD is not tactical evidence. Gap-fill VODs remain `review-queued` until direct gameplay review produces validator-clean decision moments and reviewed breakdowns. Older or online footage must remain era-labeled and must not be presented as proof of the current metagame.
