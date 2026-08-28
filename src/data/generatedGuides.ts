import type { Combo, FighterGuide, TrainingStep } from '../types'
import { profilesA } from './profilesA'
import { profilesB } from './profilesB'
import { profilesC } from './profilesC'
import { profilesD } from './profilesD'
import { profilesE } from './profilesE'
import type { ProfileTuple } from './profileTypes'
import { diddyKongProgression } from './diddyKongProgression'

const profiles: readonly ProfileTuple[] = [...profilesA, ...profilesB, ...profilesC, ...profilesD, ...profilesE]

function formatRoute(route: readonly string[]): string {
  return route.join(' → ')
}

function comboId(fighterId: string, suffix: string): string {
  return `${fighterId}-${suffix}`
}

function practiceCombo(
  fighterId: string,
  suffix: string,
  route: readonly string[],
  minPercent: number,
  maxPercent: number,
  sourceId: string,
  purpose: string,
): Combo {
  return {
    id: comboId(fighterId, suffix),
    label: formatRoute(route),
    route,
    kind: 'practice-route',
    minPercent,
    maxPercent,
    confidence: 'review',
    conditions: [
      'Training route, not a universal true-combo claim.',
      'Percent, DI, target weight/fall speed, rage, stage position, and starter hitbox can change the follow-up.',
    ],
    execution: purpose,
    sourceIds: [sourceId],
  }
}

const verifiedComboOverrides: Readonly<Record<string, readonly Combo[]>> = {
  snake: [
    {
      id: 'snake-dthrow-utilt-high',
      label: 'Down throw → Up tilt',
      route: ['Down throw', 'Up tilt'],
      kind: 'true',
      minPercent: 160,
      maxPercent: 200,
      confidence: 'verified',
      conditions: [
        'High-percent down-throw knockdown confirm; the documented threshold is around 160%.',
        'Rage and target-specific knockdown timing can shift the practical threshold.',
      ],
      execution: 'Buffer the grounded punish from the forced knockdown timing instead of trying to react late.',
      sourceIds: ['wiki-snake'],
    },
  ],
  'mii-brawler': [
    {
      id: 'mii-brawler-late-nair-jab',
      label: 'Late neutral air → Jab',
      route: ['Late neutral air', 'Jab'],
      kind: 'true',
      minPercent: 0,
      maxPercent: 35,
      confidence: 'verified',
      conditions: [
        'Use the weak/late neutral-air hit close to the ground.',
        'Exact percent window varies by target and positioning.',
      ],
      execution: 'Land immediately after the late nair connects and buffer jab.',
      sourceIds: ['wiki-mii-brawler'],
    },
  ],
  falco: [
    {
      id: 'falco-dthrow-utilt',
      label: 'Down throw → Up tilt',
      route: ['Down throw', 'Up tilt'],
      kind: 'di-dependent',
      minPercent: 0,
      maxPercent: 40,
      confidence: 'verified',
      conditions: [
        'Low-percent throw conversion; outward DI can shorten the usable window.',
        'Treat later aerial extensions as separate reads/routes rather than part of one guaranteed string.',
      ],
      execution: 'Move under the launch path and use up tilt as the stable vertical bridge.',
      sourceIds: ['wiki-falco'],
    },
  ],
  'wii-fit-trainer': [
    {
      id: 'wii-fit-deep-breathing-utilt-uair',
      label: 'Deep Breathing Up tilt → Up air',
      route: ['Deep Breathing Up tilt', 'Up air'],
      kind: 'character-dependent',
      minPercent: 65,
      maxPercent: 120,
      confidence: 'verified',
      conditions: [
        'Deep Breathing must be active.',
        'The true/KO window is target- and percent-dependent rather than universal.',
      ],
      execution: 'Confirm the up tilt, jump promptly, and track the target with up air.',
      sourceIds: ['wiki-wii-fit-trainer'],
    },
  ],
  bayonetta: [
    {
      id: 'bayonetta-ftilt3-starter',
      label: 'Forward tilt (hit 3) → aerial route',
      route: ['Forward tilt (hit 3)', 'Aerial route'],
      kind: 'character-dependent',
      minPercent: 0,
      maxPercent: 35,
      confidence: 'verified',
      conditions: [
        'Third hit of forward tilt can start true follow-ups at very low percent.',
        'The exact follow-up depends on target position and available aerial resources.',
      ],
      execution: 'Use the third-hit launch as the starter, then choose the aerial route that matches height and drift.',
      sourceIds: ['wiki-bayonetta'],
    },
  ],
}

function step(percent: number, route: readonly string[], purpose: string): TrainingStep {
  return {
    percent,
    route,
    purpose,
    notes: 'Baseline drill versus Mario. Follow DI and stop the route when positioning no longer supports it; this practice step is not automatically a true combo.',
    confidence: 'review',
  }
}

function buildGuide(profile: ProfileTuple): FighterGuide {
  const [fighterId, archetype, neutralNote, starter, mid, kill, closeout] = profile
  const sourceId = `wiki-${fighterId}`
  const generatedCombos: Combo[] = [
    practiceCombo(fighterId, 'starter-practice', starter, 0, 60, sourceId, 'Practice the opening conversion cleanly, then react to DI instead of forcing an extension.'),
    practiceCombo(fighterId, 'mid-practice', mid, 40, 120, sourceId, 'Use this as a mid-percent conversion/advantage drill and shorten it when knockback pushes the target out.'),
    practiceCombo(fighterId, 'kill-practice', kill, 90, 170, sourceId, 'Drill the high-percent setup as a confirm/read exercise; do not assume the finisher is guaranteed on every target.'),
  ]

  const guide: FighterGuide = {
    fighterId,
    archetype,
    memoryAid: `Low %: ${formatRoute(starter)}. Mid %: ${formatRoute(mid)}. High %: ${formatRoute(kill)}; when strings stop working, close with ${formatRoute(closeout)}.`,
    quickGuide: [
      neutralNote,
      `Low-percent drill: ${formatRoute(starter)}. Start with clean spacing and confirm the first hit before extending.`,
      `Mid-percent drill: ${formatRoute(mid)}. Track DI and stage position; preserving advantage is better than forcing a stale route.`,
      `High percent: look for ${formatRoute(kill)}, then transition to ${formatRoute(closeout)} when the opponent is outside combo range.`,
    ],
    trainingRoutine: [
      step(0, starter, 'Learn the primary starter without adding unnecessary inputs.'),
      step(20, starter, 'Repeat the starter while tracking the opponent’s launch direction.'),
      step(40, mid, 'Transition into the character’s mid-percent conversion.'),
      step(60, mid, 'Repeat the mid-percent route with deliberate drift and spacing.'),
      step(80, mid, 'Practice recognizing when to stop extending and hold advantage.'),
      step(100, kill, 'Introduce the high-percent setup without assuming it is already a guaranteed kill confirm.'),
      step(120, kill, 'Drill the character’s primary kill-pressure route.'),
      step(140, kill, 'Repeat the kill setup while reacting to DI, platforms, and stage position.'),
      step(160, closeout, 'Shift from combo hunting to reliable stock-closing pressure.'),
      step(180, closeout, 'Practice the edgeguard, ledge trap, throw, or raw punish that replaces long strings.'),
      step(200, closeout, 'Stay disciplined: one safe opening should lead to a finisher, not an overextended combo attempt.'),
    ],
    combos: [...generatedCombos, ...(verifiedComboOverrides[fighterId] ?? [])],
    keyFrames: [],
    sourceIds: [sourceId],
  }

  if (fighterId === 'diddy-kong') {
    return {
      ...guide,
      archetype: 'Item control · banana confirms · DI-aware route trees',
      memoryAid: 'Begin with throws, down tilt, and banana confirms. Add DI-aware aerial branches, then item re-catches, footstools, tech chases, platform resets, and Rocketbarrel cash-outs one layer at a time.',
      quickGuide: [
        neutralNote,
        'Beginner: drill down throw, down tilt, landing neutral air, and direct banana-trip confirms before adding extensions.',
        'Intermediate: branch finishers around DI, target height, fast escape options, and techable down-air landings.',
        'Pro: add footstools, Z-drop down air, jab locks, item re-catches, tech chases, and platform-reset reactions.',
        'Godlike: combine banana control, ledge trumps, Popgun cancels, Monkey Flip, platform ladders, and Rocketbarrel finishers without assuming a training-mode string is universal.',
      ],
      sourceIds: [sourceId, diddyKongProgression.sourceId],
      progression: diddyKongProgression,
    }
  }

  return guide
}

export const generatedGuides = profiles.map(buildGuide) satisfies readonly FighterGuide[]
