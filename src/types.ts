export type GuideStatus = 'ready' | 'planned'
export type Confidence = 'verified' | 'review'
export type ComboKind =
  | 'true'
  | 'kill-confirm'
  | 'di-dependent'
  | 'character-dependent'
  | 'practice-route'

export type FighterRelation =
  | { type: 'pokemon-trainer-form'; group: 'pokemon-trainer' }
  | { type: 'aegis-form'; group: 'aegis' }
  | { type: 'echo'; of: string }

export interface FighterManifestEntry {
  id: string
  name: string
  slug: string
  aliases: readonly string[]
  series: string
  order: number
  guideStatus: GuideStatus
  relation?: FighterRelation
}

export interface SourceRef {
  id: string
  label: string
  url: string
  kind: 'frame-data' | 'reference' | 'wiki'
  note?: string
}

export interface TrainingStep {
  percent: number
  route: readonly string[]
  purpose: string
  notes?: string
  confidence: Confidence
}

export interface Combo {
  id: string
  label: string
  route: readonly string[]
  kind: ComboKind
  minPercent: number
  maxPercent: number
  confidence: Confidence
  conditions?: readonly string[]
  execution?: string
  sourceIds: readonly string[]
}

export interface KeyFrame {
  move: string
  startup: number
  note: string
  sourceId: string
}

export interface FighterGuide {
  fighterId: string
  archetype: string
  memoryAid: string
  quickGuide: readonly string[]
  trainingRoutine: readonly TrainingStep[]
  combos: readonly Combo[]
  keyFrames: readonly KeyFrame[]
  sourceIds: readonly string[]
}
