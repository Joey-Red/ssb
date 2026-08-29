export type TechniqueTier = 'beginner' | 'intermediate' | 'pro' | 'godlike'
export type TechniqueVerdict = 'source-true' | 'conditional' | 'concept' | 'source-not-true'

export interface ProgressionTechnique {
  id: string
  tier: TechniqueTier
  label: string
  route: readonly string[]
  timestampSeconds: number
  opponentStartPercent: number
  verdict: TechniqueVerdict
  note?: string
  caveats?: readonly string[]
}

export interface TechniqueProgression {
  title: string
  description: string
  sourceId: string
  techniques: readonly ProgressionTechnique[]
}

const sourceId = 'video-diddy-kong-bnb-frenzy-light'
const sharedCaveat = 'The source tests selected targets and percents; do not treat the overlay as a roster-wide guarantee.'

function technique(id: string, tier: TechniqueTier, timestampSeconds: number, opponentStartPercent: number, label: string, route: readonly string[], verdict: TechniqueVerdict, note?: string, caveats?: readonly string[]): ProgressionTechnique {
  return { id, tier, timestampSeconds, opponentStartPercent, label, route, verdict, ...(note ? { note } : {}), ...(caveats ? { caveats } : {}) }
}

const trueRoute = (id: string, tier: TechniqueTier, timestampSeconds: number, opponentStartPercent: number, label: string, route: readonly string[], note?: string) =>
  technique(id, tier, timestampSeconds, opponentStartPercent, label, route, 'source-true', note, [sharedCaveat])

export const diddyKongProgression = {
  title: 'Beginner-to-Godlike Diddy progression',
  description: 'A frame-audited transcription of the demonstrated inputs. Each card begins where that exact sequence starts; repeated demonstrations remain separate when their starting damage differs.',
  sourceId,
  techniques: [
    trueRoute('diddy-b-uthrow-uair-0', 'beginner', 0, 0, 'Up throw → up air', ['Up throw', 'Up air']),
    trueRoute('diddy-b-uthrow-bair-15', 'beginner', 3, 15, 'Up throw → back air', ['Up throw', 'Back air']),
    trueRoute('diddy-b-uthrow-fair-15', 'beginner', 6, 15, 'Up throw → forward air', ['Up throw', 'Forward air']),
    trueRoute('diddy-b-dthrow-fair-15', 'beginner', 9, 15, 'Down throw → forward air', ['Down throw', 'Forward air']),
    trueRoute('diddy-b-dthrow-bair-15', 'beginner', 13, 15, 'Down throw → back air', ['Down throw', 'Back air']),
    trueRoute('diddy-b-dthrow-usmash-0', 'beginner', 16, 0, 'Down throw → up smash', ['Down throw', 'Up smash']),
    technique('diddy-b-dash-fair-0', 'beginner', 19, 0, 'Dash attack → forward air', ['Dash attack', 'Forward air'], 'conditional', undefined, ['The overlay says this is hard or not true on DI away.']),
    technique('diddy-b-dash-uair-0', 'beginner', 21, 0, 'Dash attack → up air', ['Dash attack', 'Up air'], 'conditional', undefined, ['The overlay says this is hard or not true on DI away.']),
    trueRoute('diddy-b-dtilt-uair-30', 'beginner', 23, 30, 'Down tilt → up air', ['Down tilt', 'Up air']),
    trueRoute('diddy-b-dtilt-uair-uair-30', 'beginner', 26, 30, 'Down tilt → up air → up air', ['Down tilt', 'Up air', 'Up air']),
    trueRoute('diddy-b-dtilt-usmash-30', 'beginner', 29, 30, 'Down tilt → up smash', ['Down tilt', 'Up smash']),
    trueRoute('diddy-b-dtilt-uair-bair-30', 'beginner', 32, 30, 'Down tilt → up air → back air', ['Down tilt', 'Up air', 'Back air']),
    trueRoute('diddy-b-dtilt-uair-80', 'beginner', 35, 80, 'Down tilt → up air', ['Down tilt', 'Up air'], 'Second starting-percent example.'),
    trueRoute('diddy-b-dtilt-ftilt-80', 'beginner', 37, 80, 'Down tilt → forward tilt', ['Down tilt', 'Forward tilt']),
    trueRoute('diddy-b-nair-fair-0', 'beginner', 40, 0, 'Landing neutral air → forward air', ['Landing neutral air', 'Forward air']),
    trueRoute('diddy-b-nair-uair-0', 'beginner', 42, 0, 'Landing neutral air → up air', ['Landing neutral air', 'Up air']),
    trueRoute('diddy-b-banana-dash-0', 'beginner', 44, 0, 'Banana trip → dash attack', ['Banana toss / trip', 'Dash attack']),
    trueRoute('diddy-b-banana-fsmash-35', 'beginner', 46, 35, 'Banana trip → forward smash', ['Banana toss / trip', 'Forward smash']),
    trueRoute('diddy-b-banana-fsmash-125', 'beginner', 48, 125, 'Banana trip → forward smash', ['Banana toss / trip', 'Forward smash'], 'High-percent repeat.'),

    technique('diddy-i-dtilt-grab-80', 'intermediate', 50, 80, 'Down tilt → grab → up throw → up air', ['Down tilt', 'Grab', 'Up throw', 'Up air'], 'conditional', undefined, ['Down tilt → grab is not true on some characters.']),
    technique('diddy-i-dtilt-usmash-135', 'intermediate', 54, 135, 'Down tilt → up smash', ['Down tilt', 'Up smash'], 'conditional', undefined, ['Not true on DI out at higher percents (roughly 120%+, character dependent).']),
    trueRoute('diddy-i-dtilt-fair-135', 'intermediate', 57, 135, 'Down tilt → forward air', ['Down tilt', 'Forward air']),
    trueRoute('diddy-i-dtilt-monkey-flip-35', 'intermediate', 59, 35, 'Down tilt → Monkey Flip kick', ['Down tilt', 'Monkey Flip kick']),
    trueRoute('diddy-i-dtilt-nair-uair-35', 'intermediate', 61, 35, 'Down tilt → neutral air → up air', ['Down tilt', 'Neutral air', 'Up air']),
    technique('diddy-i-dtilt-uair-uair-35', 'intermediate', 65, 35, 'Down tilt → up air → up air', ['Down tilt', 'Up air', 'Up air'], 'conditional', undefined, ['The last up air is hard or not true on DI in.']),
    trueRoute('diddy-i-banana-dair-35', 'intermediate', 68, 35, 'Banana trip → down air', ['Banana toss / trip', 'Down air']),
    trueRoute('diddy-i-banana-grab-35', 'intermediate', 71, 35, 'Banana trip → grab → pummel ×2 → up throw → up air', ['Banana toss / trip', 'Grab', 'Pummel ×2', 'Up throw', 'Up air']),
    trueRoute('diddy-i-banana-dair-100', 'intermediate', 74, 100, 'Banana trip → down air', ['Banana toss / trip', 'Down air']),
    technique('diddy-i-banana-bair-140', 'intermediate', 77, 140, 'Banana trip → back air', ['Banana toss / trip', 'Back air'], 'conditional', undefined, ['Not true on DI out/up at this percent and higher.']),
    technique('diddy-i-banana-usmash-140', 'intermediate', 80, 140, 'Banana trip → up smash', ['Banana toss / trip', 'Up smash'], 'conditional', undefined, ['The same DI out/up high-percent warning remains on screen.']),
    trueRoute('diddy-i-dtilt-uair-bair-35', 'intermediate', 83, 35, 'Down tilt → up air → back air', ['Down tilt', 'Up air', 'Back air']),
    technique('diddy-i-banana-uair-dair-85', 'intermediate', 86, 85, 'Banana toss → up air → down air', ['Banana toss', 'Up air', 'Down air'], 'conditional', undefined, ['Harder or not true on DI out.']),
    technique('diddy-i-banana-uair-dair-repeat-85', 'intermediate', 89, 85, 'Banana toss → up air → down air', ['Banana toss', 'Up air', 'Down air'], 'conditional', 'Second ledge-position demonstration.', ['Harder or not true on DI out.']),
    technique('diddy-i-dthrow-fair-fair-50', 'intermediate', 95, 50, 'Down throw → forward air → forward air', ['Down throw', 'Forward air', 'Forward air'], 'conditional', undefined, ['The last forward air is not true on DI out here, but works at lower percents.']),
    technique('diddy-i-dthrow-dair-uair-50', 'intermediate', 98, 50, 'Down throw → down air → up air', ['Down throw', 'Down air', 'Up air'], 'concept', undefined, ['Down air can be teched.']),
    technique('diddy-i-dthrow-fair-fair-repeat-50', 'intermediate', 100, 50, 'Down throw → forward air → forward air', ['Down throw', 'Forward air', 'Forward air'], 'source-not-true', undefined, ['The final forward air is marked not true in this repeat.']),
    trueRoute('diddy-i-dtilt-bair-100', 'intermediate', 103, 100, 'Down tilt → back air', ['Down tilt', 'Back air']),
    technique('diddy-i-dtilt-dair-125', 'intermediate', 105, 125, 'Down tilt → down air', ['Down tilt', 'Down air'], 'concept', undefined, ['Down air can be teched.']),
    technique('diddy-i-popgun-nair-uair-150', 'intermediate', 108, 150, 'Popgun cancel → landing neutral air → up air', ['Popgun cancel', 'Landing neutral air', 'Up air'], 'concept'),
    technique('diddy-i-dthrow-uair-bair-0', 'intermediate', 110, 0, 'Down throw → up air → back air', ['Down throw', 'Up air', 'Back air'], 'conditional', undefined, ['The last back air is not true on some characters.']),
    technique('diddy-i-banana-usmash-platform-120', 'intermediate', 113, 120, 'Banana trip → platform tech chase → up smash', ['Banana toss / trip', 'Platform tech chase', 'Up smash'], 'concept'),
    trueRoute('diddy-i-uthrow-uair-uair-40', 'intermediate', 116, 40, 'Up throw → up air → up air', ['Up throw', 'Up air', 'Up air']),
    trueRoute('diddy-i-dtilt-bair-150', 'intermediate', 118, 150, 'Down tilt → back air', ['Down tilt', 'Back air']),
    trueRoute('diddy-i-popgun-banana-fsmash-120', 'intermediate', 120, 120, 'Popgun → banana trip → forward smash', ['Popgun', 'Banana toss / trip', 'Forward smash']),
    trueRoute('diddy-i-popgun-banana-fsmash-repeat-120', 'intermediate', 123, 120, 'Popgun → banana trip → forward smash', ['Popgun', 'Banana toss / trip', 'Forward smash'], 'Second charge/timing demonstration.'),
    trueRoute('diddy-i-nair-uair-fair-100', 'intermediate', 127, 100, 'Landing neutral air → up air → forward air', ['Landing neutral air', 'Up air', 'Forward air']),
    technique('diddy-i-dthrow-upb-platform-60', 'intermediate', 130, 60, 'Down throw → Up-B hit → Rocketbarrel explosion', ['Down throw', 'Rocketbarrel Boost hit', 'Rocketbarrel explosion'], 'conditional', undefined, ['DI away from the platform to escape.']),
    trueRoute('diddy-i-uthrow-uair-110', 'intermediate', 132, 110, 'Up throw → up air', ['Up throw', 'Up air']),
    trueRoute('diddy-i-dthrow-upb-0', 'intermediate', 135, 0, 'Down throw → Up-B hit → Rocketbarrel explosion', ['Down throw', 'Rocketbarrel Boost hit', 'Rocketbarrel explosion']),
    trueRoute('diddy-i-dthrow-uair-uair-50', 'intermediate', 138, 50, 'Down throw → up air → up air', ['Down throw', 'Up air', 'Up air']),
    trueRoute('diddy-i-dthrow-uair-fair-50', 'intermediate', 140, 50, 'Down throw → up air → forward air', ['Down throw', 'Up air', 'Forward air']),
    trueRoute('diddy-i-dthrow-uair-bair-50', 'intermediate', 143, 50, 'Down throw → up air → back air', ['Down throw', 'Up air', 'Back air']),
    trueRoute('diddy-i-monkey-flip-uair-bair-50', 'intermediate', 146, 50, 'Monkey Flip grab → up air → back air', ['Monkey Flip grab', 'Up air', 'Back air']),
    trueRoute('diddy-i-nair-uair-fair-50', 'intermediate', 149, 50, 'Landing neutral air → up air → forward air', ['Landing neutral air', 'Up air', 'Forward air']),
    technique('diddy-i-dair-fair-fair-40', 'intermediate', 152, 40, 'Down air → forward air → forward air', ['Down air', 'Forward air', 'Forward air'], 'conditional', undefined, ['The continuation is not true on DI out.']),
    technique('diddy-i-dthrow-uair-fair-fair-40', 'intermediate', 155, 40, 'Down throw → up air → forward air → forward air', ['Down throw', 'Up air', 'Forward air', 'Forward air'], 'conditional', undefined, ['The final forward air is not true on DI out.']),
    technique('diddy-i-utilt-loop-0', 'intermediate', 157, 0, 'Up tilt loop → up air', ['Up tilt ×6', 'Up air'], 'concept', undefined, ['Directional air dodge escapes, but is reactable and punishable.']),
    technique('diddy-i-uair-string-30', 'intermediate', 160, 30, 'Up air → up air → up air → up air', ['Up air', 'Up air', 'Up air', 'Up air'], 'conditional', undefined, ['Not true on DI out; use back air for the DI-out branch.']),
    trueRoute('diddy-i-dtilt-uair-bair-62', 'intermediate', 161, 62, 'Down tilt → up air → back air', ['Down tilt', 'Up air', 'Back air']),
    technique('diddy-i-dthrow-uair-uair-fair-30', 'intermediate', 164, 30, 'Down throw → up air → up air → forward air', ['Down throw', 'Up air', 'Up air', 'Forward air'], 'conditional', undefined, ['DI away from the platform to escape.']),
    trueRoute('diddy-i-grab-uthrow-uair-uair-120', 'intermediate', 165, 120, 'Grab → pummel → up throw → up air → up air', ['Grab', 'Pummel', 'Up throw', 'Up air', 'Up air']),
    technique('diddy-i-banana-dtilt-usmash-125', 'intermediate', 168, 125, 'Banana trip → down tilt → up smash', ['Banana toss / trip', 'Down tilt', 'Up smash'], 'conditional', undefined, ['Not true on DI out at higher percents.']),
    technique('diddy-i-fair-uair-uair-uair-0', 'intermediate', 181, 0, 'Forward air → up air → up air → up air', ['Forward air', 'Up air', 'Up air', 'Up air'], 'conditional', undefined, ['The last up air is not true against frame-1/2 escape options.']),
    technique('diddy-i-dthrow-uair-bair-67', 'intermediate', 185, 67, 'Down throw → up air → back air', ['Down throw', 'Up air', 'Back air'], 'conditional', undefined, ['Harder or not true on DI out.']),
    technique('diddy-i-uthrow-uair-bair-30', 'intermediate', 187, 30, 'Up throw → up air → back air', ['Up throw', 'Up air', 'Back air'], 'conditional', undefined, ['Neutral air → forward air is the shown DI-out alternative.']),

    technique('diddy-p-footstool-35', 'pro', 190, 35, 'Down tilt → up air → up air → down air → footstool', ['Down tilt', 'Up air', 'Up air', 'Down air', 'Footstool'], 'concept'),
    trueRoute('diddy-p-banana-upb-0', 'pro', 195, 0, 'Banana trip → Up-B hit → Rocketbarrel explosion', ['Banana toss / trip', 'Rocketbarrel Boost hit', 'Rocketbarrel explosion']),
    technique('diddy-p-uthrow-fair-dair-0', 'pro', 198, 0, 'Up throw → forward air → down air', ['Up throw', 'Forward air', 'Down air'], 'source-not-true', undefined, ['The ordinary down-air variants are marked not true.']),
    trueRoute('diddy-p-zdrop-dair-40', 'pro', 212, 40, 'Z-drop banana → down air', ['Z-drop banana', 'Down air'], 'The overlay identifies the Z-drop version as true.'),
    technique('diddy-p-uthrow-uair-di-in-0', 'pro', 216, 0, 'Up throw → up air', ['Up throw', 'Up air'], 'conditional', 'Use up air instead of forward air on DI in.'),
    technique('diddy-p-uthrow-sideb-uair-0', 'pro', 220, 0, 'Up throw → Monkey Flip kick → up air', ['Up throw', 'Monkey Flip kick', 'Up air'], 'source-not-true', undefined, ['The overlay explicitly says up throw → Side-B is not true.']),
    technique('diddy-p-banana-dair-jablock-35', 'pro', 224, 35, 'Banana trip → down air → jab lock → down tilt → down air', ['Banana toss / trip', 'Down air', 'Jab 1 lock', 'Down tilt', 'Down air'], 'concept'),
    technique('diddy-p-landing-bair-0', 'pro', 246, 0, 'Landing back air → up tilt → up air → back air', ['Landing back air', 'Up tilt', 'Up air', 'Back air'], 'conditional', undefined, ['Directional air dodge escapes the landing-back-air continuation.']),
    technique('diddy-p-utilt-bair-0', 'pro', 256, 0, 'Up tilt → back air', ['Up tilt', 'Back air'], 'conditional', undefined, ['Character dependent / not true.']),
    technique('diddy-p-bair-banana-uairs-0', 'pro', 261, 0, 'Back air → banana toss → up-air ladder', ['Back air', 'Banana toss', 'Up air', 'Up air', 'Up air'], 'conditional', undefined, ['Back air → banana toss is marked not true / character dependent.']),
    trueRoute('diddy-p-dthrow-uair-ladder-40', 'pro', 267, 40, 'Down throw → up air → up air → up air', ['Down throw', 'Up air', 'Up air', 'Up air']),
    technique('diddy-p-utilt-platform-0', 'pro', 271, 0, 'Up tilt ×3 → up-air ladder', ['Up tilt ×3', 'Up air', 'Up air', 'Up air'], 'concept', undefined, ['Directional air dodge escapes, but can be reacted to and punished.']),
    technique('diddy-p-dthrow-uairs-fair-0', 'pro', 277, 0, 'Down throw → up air → up air → forward air', ['Down throw', 'Up air', 'Up air', 'Forward air'], 'conditional', undefined, ['The last forward air is not true.']),
    technique('diddy-p-bair-nair-bair-0', 'pro', 283, 0, 'Back air → neutral air → back air', ['Back air', 'Neutral air', 'Back air'], 'concept', undefined, ['Back air → neutral air is not true, but can frame-trap.']),
    technique('diddy-p-dtilt-dtilt-usmash-126', 'pro', 288, 126, 'Down tilt → down tilt → up smash', ['Down tilt', 'Down tilt', 'Up smash'], 'concept', undefined, ['Directional air dodge escapes tilt → tilt, but can be reacted to and punished.']),
    technique('diddy-p-platform-upb-0', 'pro', 292, 0, 'Up throw → platform reset → Up-B hit → Rocketbarrel explosion', ['Up throw', 'Platform reset', 'Rocketbarrel Boost hit', 'Rocketbarrel explosion'], 'conditional', undefined, ['DI away from the platform to escape.']),
    technique('diddy-p-jablock-upb-40', 'pro', 296, 40, 'Forward air → jab lock → Up-B hit → Rocketbarrel explosion', ['Forward air', 'Jab 1 lock', 'Jab 2', 'Rocketbarrel Boost hit', 'Rocketbarrel explosion'], 'concept'),
    technique('diddy-p-fthrow-bair-bair-0', 'pro', 305, 0, 'Forward throw → back air → back air', ['Forward throw', 'Back air', 'Back air'], 'source-not-true', undefined, ['Not true on DI out or directional air dodge.']),
    technique('diddy-p-jablock-upb-0', 'pro', 310, 0, 'Forward air → jab lock → Up-B hit → Rocketbarrel explosion', ['Forward air', 'Jab 1 lock', 'Jab 2', 'Rocketbarrel Boost hit', 'Rocketbarrel explosion'], 'concept'),
    technique('diddy-p-techchase-upb-0', 'pro', 314, 0, 'Forward air → banana toss → down air → Up-B hit → Rocketbarrel explosion', ['Forward air', 'Banana toss', 'Down air', 'Rocketbarrel Boost hit', 'Rocketbarrel explosion'], 'concept'),
    technique('diddy-p-falling-bair-uairs-0', 'pro', 318, 0, 'Falling back air → up-air ladder', ['Falling back air', 'Up air', 'Up air', 'Up air'], 'conditional', undefined, ['Falling back air is marked hard / not true.']),
    technique('diddy-p-dthrow-uair-five-0', 'pro', 322, 0, 'Down throw → up-air ladder', ['Down throw', 'Up air ×5'], 'conditional', undefined, ['Up air → up air has a tight window.']),
    technique('diddy-p-platform-dair-upb-0', 'pro', 327, 0, 'Up throw → platform reset → down air → Up-B hit', ['Up throw', 'Platform reset', 'Down air', 'Rocketbarrel Boost hit'], 'concept', undefined, ['Down air is shown as a neutral-air-dodge read.']),
    technique('diddy-p-double-toss-fair-90', 'pro', 360, 90, 'Banana up toss → re-catch → banana toss → forward air', ['Banana up toss', 'Re-catch', 'Banana toss', 'Forward air'], 'concept'),
    technique('diddy-p-uptoss-dair-90', 'pro', 372, 90, 'Banana up toss → down air', ['Banana up toss', 'Down air'], 'conditional', undefined, ['Not true / character dependent on DI out.']),
    technique('diddy-p-zdrop-recatch-fsmash-90', 'pro', 379, 90, 'Z-drop banana → re-catch → forward smash', ['Z-drop banana', 'Re-catch', 'Forward smash'], 'concept'),
    technique('diddy-p-ladder-di-20', 'pro', 389, 20, 'Down throw → up-air ladder → back air', ['Down throw', 'Up air', 'Up air', 'Back air'], 'conditional', undefined, ['Back air can replace the last up air on DI out.']),
    technique('diddy-p-bair-banana-upb-0', 'pro', 433, 0, 'Back air → banana toss → Up-B hit → Rocketbarrel explosion', ['Back air', 'Banana toss', 'Rocketbarrel Boost hit', 'Rocketbarrel explosion'], 'conditional', undefined, ['Back air → banana toss has a tight window.']),

    technique('diddy-g-dacit-83', 'godlike', 442, 83, 'Dash-attack-cancel banana toss → down tilt → forward smash', ['Dash-attack-cancel banana toss', 'Down tilt', 'Stutter-step forward smash'], 'concept'),
    technique('diddy-g-footstool-upb-0', 'godlike', 445, 0, 'Monkey Flip grab → footstool ladder → down air → Up-B', ['Monkey Flip grab', 'Footstool', 'Up air', 'Up air', 'Up air', 'Down air', 'Rocketbarrel Boost hit', 'Rocketbarrel explosion'], 'concept'),
    technique('diddy-g-banana-platform-0', 'godlike', 467, 0, 'Banana up toss → platform ladder → forward air', ['Banana up toss', 'Up air', 'Up air', 'Down air', 'Up air', 'Forward air'], 'concept'),
    technique('diddy-g-swag-kicks-0', 'godlike', 484, 0, 'Forward-air carry → down air', ['Forward air', 'Forward air', 'Forward air', 'Down air'], 'concept'),
    technique('diddy-g-bananas-stock-93', 'godlike', 489, 93, 'Banana trip → down tilt → up smash', ['Banana toss / trip', 'Down tilt', 'Up smash'], 'concept'),
    technique('diddy-g-ledgetrump-45', 'godlike', 495, 45, 'Banana toss → run-off ledge trump → back air', ['Banana toss', 'Run off', 'Ledge trump', 'Back air'], 'concept'),
    technique('diddy-g-zero-banana-0', 'godlike', 505, 0, 'Banana trip → down tilt → up-air ladder → down air', ['Banana toss / trip', 'Down tilt', 'Up air', 'Up air', 'Up air', 'Down air'], 'concept'),
    technique('diddy-g-popgun-read-20', 'godlike', 511, 20, 'Popgun cancel → neutral air → air-dodge read → down air', ['Popgun cancel', 'Neutral air', 'Air-dodge read', 'Down air'], 'concept'),
    technique('diddy-g-zero-no-banana-0', 'godlike', 516, 0, 'Landing neutral air → Monkey Flip kick → up-air ladder → down air', ['Landing neutral air', 'Monkey Flip kick', 'Up air', 'Up air', 'Down air'], 'concept'),
    technique('diddy-g-wario-45', 'godlike', 521, 45, 'Down tilt → up-air ladder → down air', ['Down tilt', 'Up air', 'Up air', 'Down air'], 'concept'),
    technique('diddy-g-shield-break-80', 'godlike', 543, 80, 'Banana pressure → Rocketbarrel explosion → shield-break punish', ['Banana toss', 'Shield pressure', 'Rocketbarrel explosion', 'Forward smash'], 'concept'),
    technique('diddy-g-platform-banana-76', 'godlike', 549, 76, 'Banana up toss → platform reset → up-air ladder', ['Banana up toss', 'Platform reset', 'Up air', 'Up air', 'Forward air'], 'concept'),
    technique('diddy-g-dair-upb-0', 'godlike', 557, 0, 'Down air → banana toss → Up-B hit → Rocketbarrel explosion', ['Down air', 'Banana toss', 'Rocketbarrel Boost hit', 'Rocketbarrel explosion'], 'concept'),
    technique('diddy-g-dair-confirm-20', 'godlike', 562, 20, 'Banana toss → down air → up smash', ['Banana toss', 'Down air', 'Up smash'], 'concept'),
    technique('diddy-g-monkey-flip-0', 'godlike', 564, 0, 'Landing neutral air → Monkey Flip kick → up air → down air', ['Landing neutral air', 'Monkey Flip kick', 'Up air', 'Down air'], 'concept'),
    technique('diddy-g-stock-tree-0', 'godlike', 580, 0, 'Banana trip → up-air ladder → forward air', ['Banana toss / trip', 'Up air', 'Up air', 'Forward air'], 'concept'),
    technique('diddy-g-uptoss-platform-0', 'godlike', 602, 0, 'Banana up toss → platform reset → re-catch → up-air ladder', ['Banana up toss', 'Platform reset', 'Re-catch', 'Up air', 'Up air', 'Forward air'], 'concept'),
    technique('diddy-g-ladder-105', 'godlike', 636, 105, 'Platform up-air ladder → back air', ['Up air', 'Platform reset', 'Up air', 'Back air'], 'concept'),
    technique('diddy-g-upb-20', 'godlike', 644, 20, 'Down throw → up air → Up-B hit → Rocketbarrel explosion', ['Down throw', 'Up air', 'Rocketbarrel Boost hit', 'Rocketbarrel explosion'], 'concept'),
    technique('diddy-g-final-0', 'godlike', 650, 0, 'Landing neutral air → up air → forward air', ['Landing neutral air', 'Up air', 'Forward air'], 'concept'),
  ],
} as const satisfies TechniqueProgression
