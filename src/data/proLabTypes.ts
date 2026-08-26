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
  round: string
  videoUrl: string
  videoProvider: 'youtube' | 'other'
  videoId?: string
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

export interface ProDecisionMoment {
  id: string
  vodId: string
  game: number
  timestampSeconds: number
  fighterId: string
  context: DecisionContext
  state: DecisionGameState
  chosenOption: string
  observableOutcome: string
  interpretation?: string
  plausibleAlternatives?: readonly string[]
  evidenceClass: DecisionEvidenceClass
  confidence: number
  teachingTags: readonly string[]
  reviewerNote?: string
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
