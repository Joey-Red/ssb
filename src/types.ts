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
    /** Maintenance transport only; the canonical values are attributed to UFD. */
    transportMirror?: string
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

export type VisualFramePhase = 'startup' | 'active' | 'recovery' | 'landing' | 'intangible' | 'other'
export type VisualRegionKind = 'strong' | 'weak' | 'grab' | 'hurtbox' | 'intangible'
export type VisualTimelineClass =
  | 'fighter-action'
  | 'landing'
  | 'projectile'
  | 'effect'
  | 'charge-state'
  | 'loop-state'
  | 'companion-action'
  | 'transition'
  /** Display-only same-origin source sequence; its frame numbers are not SSBU game-frame claims. */
  | 'source-animation'
export type VisualMediaCoverage =
  | 'full'
  | 'source-timed'
  | 'exact-static'
  | 'partial'
  | 'untimed-animation'
  | 'static'

/** Coordinates are percentages of the displayed exact-frame image. */
export interface VisualCircleRegion {
  id: string
  kind: VisualRegionKind
  x: number
  y: number
  radius: number
  label?: string
}

export interface VisualFrame {
  frame: number
  phase: VisualFramePhase
  imageSrc?: string
  caption?: string
  regions?: readonly VisualCircleRegion[]
}

/**
 * A local sprite sheet packs source images into a fixed grid.
 * `frameNumbers` maps each physical sheet cell to the first timeline frame it
 * represents. `gameFrameCells`, when present, maps every 1-based timeline frame
 * to a zero-based physical sheet cell; repeated cell indexes represent a source
 * image whose encoded duration truthfully holds across several 60 FPS frames.
 */
export interface VisualSpriteSheet {
  src: string
  frameWidth: number
  frameHeight: number
  columns: number
  frameCount: number
  frameNumbers?: readonly number[]
  gameFrameCells?: readonly number[]
}

export interface VisualMediaVariant {
  id: string
  label: string
  spriteSheet?: VisualSpriteSheet
  animationSrc?: string
  imageSrc?: string
  coverage?: VisualMediaCoverage
  coverageReason?: string
  sourceFrameCount?: number
  sourceDurationMs?: number | null
  sourceLoop?: number
  timelineClass?: VisualTimelineClass
  timelineTotalFrames?: number
  timingBasis?: 'parent-action' | 'independent-source'
  timelineBasis?: string
  mappingMethod?: string
  sourceFormat?: string
  /** Original factual timeline represented when this runtime variant is shown as a display-only source animation. */
  sourcePlaybackOfTimelineClass?: VisualTimelineClass
  /** Collision visualization comes from staged source media, reviewed overlay metadata, or a reviewed local frame capture. */
  interactionEvidence?: 'embedded-source' | 'reviewed-overlay' | 'reviewed-capture'
  reviewedOverride?: {
    sourceUrl: string
    provenanceNote: string
  }
}

export interface VisualMoveMedia {
  id: string
  fighterId: string
  moveId: string
  label: string
  sourceUrl: string
  /** Legacy/local preview support; never treated as seek-synchronized. */
  animatedPreviewUrl?: string
  /** Primary exact source-frame sheet retained for backwards compatibility. */
  spriteSheet?: VisualSpriteSheet
  /** All locally staged source variants (angled attacks, landing variants, etc.). */
  variants?: readonly VisualMediaVariant[]
  totalFrames: number
  frames: readonly VisualFrame[]
}
