import type { FighterGuide } from '../types'
import { generatedGuides } from './generatedGuides'
import { guides as referenceGuides } from './guides'

export const allGuides = [...referenceGuides, ...generatedGuides] as const satisfies readonly FighterGuide[]

export const guideByFighterId = new Map<string, FighterGuide>(
  allGuides.map((guide) => [guide.fighterId, guide]),
)
