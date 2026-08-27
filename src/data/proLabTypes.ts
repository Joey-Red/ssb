export type ProPlayerStatus = 'active' | 'legacy'
export type ProCharacterRole = 'main' | 'co-main' | 'secondary'
export type ProResearchStatus = 'research-queued' | 'seeded' | 'cataloged' | 'annotated' | 'reviewed'

export interface ProCharacterRoleEntry {
  fighterId: string
  role: ProCharacterRole
  activeFrom?: string
  activeTo?: string
}

export interface ProPlayerRepresentative {
  id: string
  tag: string
  country: string
  region: string
  status: ProPlayerStatus
  characterRoles: readonly ProCharacterRoleEntry[]
  sourceUrls: readonly string[]
  note?: string
}

export interface ProFighterResearchEntry {
  fighterId: string
  status: ProResearchStatus
  representativeIds: readonly string[]
  researchNotes?: readonly string[]
}

export type ProVodEventTier = 'supermajor' | 'major' | 'regional' | 'invitational' | 'weekly' | 'unknown'
export type ProVodAnalysisStatus = 'cataloged' | 'review-queued' | 'annotated' | 'reviewed'
export type ProVodLinkKind = 'direct-video' | 'source-index'
export type ProVodDatePrecision = 'exact' | 'event-anchor'

export interface ProVodQuality {
  tournamentEnvironment: boolean
  fullSet: boolean
  officialOrTournamentChannel: boolean
  visibleGameplay: boolean
  patchKnown: boolean
  score: number
  notes: readonly string[]
}

export interface ProVodRecord {
  id: string
  title: string
  playerId: string
  playerFighterIds: readonly string[]
  opponentTag: string
  opponentFighterIds: readonly string[]
  event: string
  eventTier: ProVodEventTier
  date: string
  datePrecision?: ProVodDatePrecision
  round: string
  videoUrl: string
  videoProvider: 'youtube' | 'other'
  videoId?: string
  linkKind?: ProVodLinkKind
  startSeconds?: number
  endSeconds?: number
  gameVersion: '13.0.1' | 'unknown'
  result?: string
  sourceUrls: readonly string[]
  analysisStatus: ProVodAnalysisStatus
  quality: ProVodQuality
}

export type DecisionContext =
  | 'neutral'
  | 'advantage'
  | 'disadvantage'
  | 'ledge'
  | 'recovery'
  | 'tech-chase'
  | 'shield-pressure'
  | 'punish'
  | 'kill-setup'
  | 'resource-management'
  | 'adaptation'

export type DecisionEvidenceClass = 'observed' | 'strong-inference' | 'reasonable-inference' | 'speculative'

export interface DecisionGameState {
  playerStocks?: number
  opponentStocks?: number
  playerPercent?: number
  opponentPercent?: number
  stage?: string
  position?: 'center' | 'corner' | 'ledge' | 'offstage' | 'platform' | 'unknown'
  resources?: readonly string[]
}

export type ProFrameMetric = 'startup' | 'active' | 'totalFrames' | 'faf' | 'landingLag' | 'onShield'

/**
 * A reviewed moment can point at an existing move row when a numeric property
 * actually matters to the teaching point. The reference never stores a copied
 * number: the live Pro Lab resolves values from the committed frame snapshot.
 */
export interface ProFrameDataReference {
  fighterId: string
  moveId?: string
  moveName: string
  metrics: readonly ProFrameMetric[]
  note?: string | undefined
}

export interface ProDecisionMoment {
  id: string
  vodId: string
  game: number
  timestampSeconds: number
  fighterId: string
  opponentFighterId?: string | undefined
  context: DecisionContext
  state: DecisionGameState
  chosenOption: string
  observableOutcome: string
  interpretation?: string | undefined
  plausibleAlternatives?: readonly string[] | undefined
  evidenceClass: DecisionEvidenceClass
  confidence: number
  teachingTags: readonly string[]
  frameDataReferences?: readonly ProFrameDataReference[] | undefined
  reviewerNote?: string | undefined
}

export interface ProSetPhaseSummary {
  label: string
  startGame: number
  endGame: number
  summary: string
  evidenceMomentIds: readonly string[]
}

export interface ProSetBreakdown {
  vodId: string
  status: 'queued' | 'annotated' | 'reviewed'
  thesis?: string
  phaseSummaries: readonly ProSetPhaseSummary[]
  decisionMomentIds: readonly string[]
  recurringHabits: readonly string[]
  adaptationNotes: readonly string[]
  reviewerNotes?: readonly string[]
}

export interface ProPatternSummary {
  id: string
  fighterId: string
  playerIds: readonly string[]
  context: DecisionContext
  teachingTag: string
  occurrenceCount: number
  vodCount: number
  evidenceMomentIds: readonly string[]
  statement: string
  confidence: number
}

export type ProLessonTopic =
  | 'top-player-priorities'
  | 'neutral'
  | 'advantage'
  | 'disadvantage'
  | 'ledgetrapping'
  | 'recovery'
  | 'stock-closing'
  | 'adaptations'
  | 'beginner-vs-pro'

export interface ProLessonClaim {
  id: string
  fighterId: string
  topic: ProLessonTopic
  statement: string
  evidenceMomentIds: readonly string[]
  evidenceVodIds: readonly string[]
  playerIds: readonly string[]
  confidence: number
  teachingTags: readonly string[]
}

export interface ProCharacterLesson {
  fighterId: string
  status: 'evidence-pending' | 'evidence-building' | 'ready'
  claims: readonly ProLessonClaim[]
  playerIds: readonly string[]
  vodIds: readonly string[]
  evidenceMomentIds: readonly string[]
}

export interface ProDecisionExercise {
  id: string
  momentId: string
  vodId: string
  fighterId: string
  opponentFighterId?: string | undefined
  game: number
  timestampSeconds: number
  context: DecisionContext
  prompt: string
  state: DecisionGameState
  options: readonly string[]
  actualOption: string
  observableOutcome: string
  explanation?: string | undefined
  evidenceClass: DecisionEvidenceClass
  confidence: number
  frameDataReferences: readonly ProFrameDataReference[]
}

export interface ProResolvedFrameMetric {
  key: ProFrameMetric
  label: string
  value: string | null
}

export interface ProResolvedFrameReference {
  fighterId: string
  moveId: string
  moveName: string
  sourceUrl: string
  metrics: readonly ProResolvedFrameMetric[]
  note?: string | undefined
}

export interface ProPracticeDrillSeed {
  fighterId: string
  title: string
  setup: string
  route: readonly string[]
  percent: number | null
  targetReps: number
  notes: string
  teachingObjective: string
  evidenceMomentId: string
  vodId: string
}

export interface ProMatchupPattern {
  id: string
  fighterId: string
  opponentFighterId: string
  context: DecisionContext
  teachingTag: string
  occurrenceCount: number
  vodCount: number
  playerIds: readonly string[]
  evidenceMomentIds: readonly string[]
  statement: string
  confidence: number
}

export interface ProPlayerStyleSignal {
  teachingTag: string
  context: DecisionContext
  occurrenceCount: number
  vodCount: number
  evidenceMomentIds: readonly string[]
  confidence: number
}

export interface ProPlayerComparison {
  fighterId: string
  playerIds: readonly string[]
  sharedSignals: readonly string[]
  playerSignals: Readonly<Record<string, readonly ProPlayerStyleSignal[]>>
  evidenceMomentIds: readonly string[]
  status: 'evidence-building' | 'ready'
}

export type ProEvidenceEra = 'current' | 'recent' | 'legacy'

export interface ProTemporalEvidence {
  vodId: string
  era: ProEvidenceEra
  eventDate: string
  gameVersion: ProVodRecord['gameVersion']
  playerStatus: ProPlayerStatus
  reasons: readonly string[]
}

export type ProMaintenanceSeverity = 'info' | 'warning' | 'error'

export interface ProMaintenanceFinding {
  code: string
  severity: ProMaintenanceSeverity
  message: string
  ids: readonly string[]
}

export interface ProMaintenanceReport {
  referenceDate: string
  findings: readonly ProMaintenanceFinding[]
  duplicateLearningRecords: readonly string[]
  malformedUrls: readonly string[]
  staleVodIds: readonly string[]
  fightersWithoutCatalogedVods: readonly string[]
  externalLinkHealth: 'maintenance-workflow-required'
}

export type ProCoverageState =
  | 'research-queued'
  | 'representative-seeded'
  | 'cataloged'
  | 'evidence-building'
  | 'teaching-ready'

export interface ProFighterCoverage {
  fighterId: string
  state: ProCoverageState
  representativeCount: number
  activeRepresentativeCount: number
  vodCount: number
  currentVodCount: number
  reviewedMomentCount: number
  lessonClaimCount: number
  decisionExerciseCount: number
  matchupPatternCount: number
  comparisonReady: boolean
  notes: readonly string[]
}
