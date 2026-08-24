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

export type MoveCategory = 'ground' | 'aerial' | 'special' | 'grab' | 'defense' | 'misc'

/**
 * Raw UFD notation is intentionally preserved for factual fields that can
 * contain ranges, multi-hits, or early/late values. Total frames and FAF are
 * separate fields: one is never silently substituted for the other.
 */
export interface FrameMove {
  id: string
  name: string
  category: MoveCategory
  startup: string | null
  startupFrame: number | null
  active: string | null
  totalFrames: string | null
  faf: string | null
  landingLag: string | null
  autocancel: string | null
  damage: string | null
  onShield: string | null
  shieldLag: string | null
  shieldStun: string | null
  hitboxType: string | null
  endLag: string | null
  notes: string | null
}

export interface FighterFrameStats {
  weight: string | null
  gravity: string | null
  walkSpeed: string | null
  runSpeed: string | null
  initialDash: string | null
  airSpeed: string | null
  airAcceleration: string | null
  fallSpeed: string | null
  fastFallSpeed: string | null
}

export interface FighterFrameData {
  fighterId: string
  name: string
  sourceUrl: string
  stats: FighterFrameStats
  moves: readonly FrameMove[]
}

export interface FrameDataSnapshot {
  version: 1
  generatedAt: string
  source: {
    id: 'ultimate-frame-data'
    label: string
    baseUrl: string
  }
  fighters: Readonly<Record<string, FighterFrameData>>
}

export type MediaLicenseStatus = 'project-owned' | 'explicitly-licensed' | 'source-link-only'

export interface MediaAsset {
  id: string
  fighterId?: string
  label: string
  kind: 'diagram' | 'icon' | 'image' | 'animation' | 'external-reference'
  status: MediaLicenseStatus
  src?: string
  sourceUrl?: string
  attribution?: string
  license?: string
}
