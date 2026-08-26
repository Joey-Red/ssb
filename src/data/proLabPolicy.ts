export interface ProVodQualityRule {
  id: string
  label: string
  required: boolean
  weight: number
  description: string
}

export const proVodQualityRules = [
  {
    id: 'competition-environment',
    label: 'Competition environment',
    required: true,
    weight: 3,
    description: 'The footage must come from an organized tournament, invitational, qualifier, or documented competitive bracket rather than friendlies or highlight compilations.',
  },
  {
    id: 'full-set',
    label: 'Full set preferred',
    required: true,
    weight: 3,
    description: 'Prefer a complete set or a stream segment with the full set. Short clips may be discovery leads but are not enough for set-level analysis.',
  },
  {
    id: 'visible-gameplay',
    label: 'Gameplay is readable',
    required: true,
    weight: 3,
    description: 'Stocks, percents, stage position, player tags, and the important interaction must be visible well enough to support factual annotations.',
  },
  {
    id: 'source-quality',
    label: 'Tournament or established channel',
    required: false,
    weight: 2,
    description: 'Prefer the tournament organizer, established tournament broadcaster, or another stable archival upload over reuploads and compilations.',
  },
  {
    id: 'recent-patch',
    label: 'Current game version or known era',
    required: false,
    weight: 2,
    description: 'Prefer current-version footage. Older footage remains useful when its date and game era are explicit and no outdated interaction is taught as current fact.',
  },
  {
    id: 'strong-opposition',
    label: 'Strong opposition',
    required: false,
    weight: 1,
    description: 'Majors, supermajors, and deep regional brackets are preferred because adaptation and decision pressure are more representative of serious competition.',
  },
  {
    id: 'character-confirmed',
    label: 'Character usage confirmed',
    required: true,
    weight: 3,
    description: 'The target player must actually use the target fighter in the analyzed game or set segment. A player being known for a character is not sufficient.',
  },
  {
    id: 'provenance',
    label: 'Source provenance retained',
    required: true,
    weight: 3,
    description: 'Keep the public VOD URL plus at least one corroborating tournament/player/result source when available. Unknown metadata stays unknown.',
  },
] as const satisfies readonly ProVodQualityRule[]

export const proLabInterpretationPolicy = {
  factualLanguage: 'Describe visible actions and outcomes as observations.',
  inferredLanguage: 'Use likely/may/suggests language for tactical interpretation. Never claim access to a player\'s private thoughts or intent.',
  speculation: 'Speculative interpretations are excluded from default teaching summaries until reviewed.',
  alternatives: 'Plausible alternatives are teaching prompts, not claims that another option was objectively better.',
  copyright: 'Store links, timestamps, factual metadata, and original analysis. Do not copy or redistribute full tournament video files.',
  runtimeNetworking: 'External VODs remain explicit user-opened references. The production app does not silently load third-party video resources.',
} as const

export const minimumCatalogQualityScore = 12
export const maximumCatalogQualityScore = proVodQualityRules.reduce((total, rule) => total + rule.weight, 0)
