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

function technique(
  id: string,
  tier: TechniqueTier,
  timestampSeconds: number,
  opponentStartPercent: number,
  label: string,
  route: readonly string[],
  verdict: TechniqueVerdict,
  note?: string,
  caveats?: readonly string[],
): ProgressionTechnique {
  return {
    id,
    tier,
    timestampSeconds,
    opponentStartPercent,
    label,
    route,
    verdict,
    ...(note ? { note } : {}),
    ...(caveats ? { caveats } : {}),
  }
}

const sharedCaveat = 'The source tests selected targets and percents; do not treat the overlay as a roster-wide guarantee.'

export const diddyKongProgression = {
  title: 'Beginner-to-Godlike Diddy progression',
  description: 'A direct index of the video’s distinct route families and technique blocks. Repeated demonstrations at different percents or against different targets are consolidated under one card; every card links back to the start of its source block.',
  sourceId,
  techniques: [
    technique('diddy-video-beginner-dtilt-uair', 'beginner', 0, 0, 'Down tilt into up air', ['Down tilt', 'Up air'], 'source-true', 'The opening block demonstrates the compact vertical down-tilt conversion.', [sharedCaveat]),
    technique('diddy-video-beginner-dtilt-fair', 'beginner', 5, 15, 'Down tilt into forward air', ['Down tilt', 'Forward air'], 'source-true', 'A forward-drift branch for carrying the target horizontally.', [sharedCaveat]),
    technique('diddy-video-beginner-dash-uair', 'beginner', 13, 15, 'Dash attack into up air', ['Dash attack', 'Up air'], 'source-true', 'Use the multi-hit launcher to place the target above Diddy for up air.', [sharedCaveat]),
    technique('diddy-video-beginner-dash-fair', 'beginner', 19, 0, 'Dash attack into forward air', ['Dash attack', 'Forward air'], 'conditional', 'Use the launcher to begin the horizontal aerial chase.', ['The source overlay says this becomes hard or not true on DI away.']),
    technique('diddy-video-beginner-dtilt-usmash', 'beginner', 24, 0, 'Down tilt into up smash', ['Down tilt', 'Up smash'], 'source-true', 'The core grounded percent-building and stock-closing confirm is repeated across several starting percents.', [sharedCaveat]),
    technique('diddy-video-beginner-dtilt-nair-fair', 'beginner', 32, 30, 'Down tilt into neutral air and forward air', ['Down tilt', 'Neutral air', 'Forward air'], 'source-true', 'The longer down-tilt branch uses neutral air to bridge into the horizontal finisher.', [sharedCaveat]),
    technique('diddy-video-beginner-dtilt-ftilt', 'beginner', 38, 80, 'Down tilt into forward tilt', ['Down tilt', 'Forward tilt'], 'source-true', 'A compact high-percent grounded branch when the aerial route is no longer needed.', [sharedCaveat]),
    technique('diddy-video-beginner-nair-fair', 'beginner', 40, 0, 'Landing neutral air into forward air', ['Landing neutral air', 'Forward air'], 'source-true', 'Land low after nair, then drift into the horizontal finisher.', [sharedCaveat]),
    technique('diddy-video-beginner-nair-uair', 'beginner', 43, 0, 'Landing neutral air into up air', ['Landing neutral air', 'Up air'], 'source-true', 'Use the vertical branch when the target remains above Diddy.', [sharedCaveat]),
    technique('diddy-video-beginner-banana-dash', 'beginner', 45, 0, 'Banana trip into dash attack', ['Banana toss / trip', 'Dash attack'], 'source-true', 'The first basic item confirm converts the trip into immediate damage.', [sharedCaveat]),
    technique('diddy-video-beginner-banana-fsmash', 'beginner', 48, 125, 'Banana trip into forward smash', ['Banana toss / trip', 'Forward smash'], 'source-true', 'The Beginner section closes with the direct high-percent banana punish.', [sharedCaveat]),

    technique('diddy-video-intermediate-dtilt-grab', 'intermediate', 50, 80, 'Down tilt into grab', ['Down tilt', 'Grab', 'Throw follow-up'], 'conditional', 'The source builds a throw conversion from down tilt.', ['On-screen caveat: “Dtilt → grab not true on some characters.”']),
    technique('diddy-video-intermediate-high-dtilt', 'intermediate', 54, 100, 'High-percent down-tilt extension', ['Down tilt', 'Aerial chase'], 'conditional', 'A high-percent extension demonstrated around the source’s +120% region.', ['On-screen caveat: not true on DI out at higher percents, roughly +120 depending on character.']),
    technique('diddy-video-intermediate-uair-ladder', 'intermediate', 59, 35, 'Up-air ladder with DI branches', ['Starter', 'Up air', 'Up air', 'Finisher'], 'conditional', 'Track the target through the ladder rather than committing to a fixed final hit.', ['On-screen caveat: the last up air is hard or not true on DI in.']),
    technique('diddy-video-intermediate-banana-uair', 'intermediate', 69, 35, 'Banana trip into vertical conversion', ['Banana toss / trip', 'Up air route'], 'source-true', 'Banana creates the grounded opening for the vertical route.', [sharedCaveat]),
    technique('diddy-video-intermediate-banana-smash', 'intermediate', 75, 100, 'Banana trip into smash punish', ['Banana toss / trip', 'Smash attack'], 'source-true', 'A higher-percent cash-out from the same item starter.', [sharedCaveat]),
    technique('diddy-video-intermediate-banana-aerial', 'intermediate', 84, 35, 'Banana toss into aerial string', ['Banana toss', 'Aerial string'], 'conditional', 'The source changes aerials and drift to match DI.', ['Several shown endings become harder or cease to be true on DI out.']),
    technique('diddy-video-intermediate-fair-branch', 'intermediate', 96, 50, 'Forward-air branch', ['Aerial starter', 'Forward air'], 'conditional', 'Use fair as the horizontal branch at lower percents.', ['On-screen caveat: fair is not true on DI out in the shown higher-percent variation, but is at lower percents.']),
    technique('diddy-video-intermediate-dair-tech', 'intermediate', 98, 50, 'Down-air tech-chase branch', ['Launcher', 'Down air', 'Tech chase'], 'concept', 'The source demonstrates down air as a continuation and explicitly treats the landing as an interactive state.', ['On-screen caveat: down air can be teched.']),
    technique('diddy-video-intermediate-popgun-cancel', 'intermediate', 109, 150, 'Popgun-cancel mix-up', ['Popgun cancel', 'Movement / aerial mix-up'], 'concept', 'Cancel Peanut Popgun to alter timing and movement before the next attack.'),
    technique('diddy-video-intermediate-bair-finish', 'intermediate', 110, 0, 'Back-air finisher branch', ['Aerial starter', 'Back air', 'Back air'], 'conditional', 'A horizontal ladder finish that is demonstrated against multiple targets.', ['On-screen caveat: the last back air is not true on some characters.']),
    technique('diddy-video-intermediate-platform-tech', 'intermediate', 114, 120, 'Platform tech chase', ['Launcher', 'Platform landing', 'Tech-chase punish'], 'concept', 'Route the launch onto a platform, then cover the landing choice instead of calling the setup guaranteed.'),
    technique('diddy-video-intermediate-platform-reset', 'intermediate', 130, 60, 'Platform reset route', ['Aerial launcher', 'Platform reset', 'Aerial punish'], 'conditional', 'The platform creates another launch-and-land decision.', ['The source tests DI away from the platform as the escape route.']),
    technique('diddy-video-intermediate-uair-di', 'intermediate', 169, 60, 'Up-air string with back-air DI-out branch', ['Up air string', 'Up air / Back air finisher'], 'conditional', 'Replace the vertical finisher with back air when the opponent drifts out.', ['On-screen caveat: the up-air string is not true on DI out; back air works instead.']),
    technique('diddy-video-intermediate-frame-escape', 'intermediate', 178, 125, 'Ladder ender versus fast escapes', ['Aerial ladder', 'Delayed finisher / pressure'], 'conditional', 'End or branch the route when the opponent has a frame-1/2 escape.', ['On-screen caveat: the last up air is not true against frame-1/2 escape options.']),
    technique('diddy-video-intermediate-nair-fair-di', 'intermediate', 185, 15, 'Neutral-air to forward-air DI-out branch', ['Neutral air', 'Forward air'], 'conditional', 'The source explicitly gives nair → fair as the DI-out alternative.', ['The preceding vertical route is harder or not true on DI out.']),

    technique('diddy-video-pro-footstool', 'pro', 190, 35, 'Footstool conversion concept', ['Setup hit', 'Footstool', 'Item / aerial follow-up'], 'concept', 'The Pro section opens by turning a footstool state into continued advantage.'),
    technique('diddy-video-pro-footstool-dair', 'pro', 199, 0, 'Footstool down-air variants', ['Footstool setup', 'Down air'], 'source-not-true', 'The source contrasts several down-air timings.', ['On-screen caveat: the ordinary down-air variants are not true.']),
    technique('diddy-video-pro-zdrop-dair', 'pro', 212, 40, 'Z-drop down-air conversion', ['Item setup', 'Z-drop', 'Down air'], 'source-true', 'The video identifies the Z-drop version as the true down-air branch.', [sharedCaveat]),
    technique('diddy-video-pro-di-in-uair', 'pro', 216, 0, 'DI-in up-air branch', ['Starter', 'Up air'], 'conditional', 'Use up air instead of fair when the opponent DIs in.'),
    technique('diddy-video-pro-uthrow-sideb', 'pro', 220, 0, 'Up throw into Monkey Flip', ['Up throw', 'Monkey Flip (Side-B)'], 'source-not-true', 'The route is shown as a pressure idea, not a true combo.'),
    technique('diddy-video-pro-jablock', 'pro', 224, 35, 'Jab-lock conversion', ['Knockdown', 'Jab lock', 'Confirmed punish'], 'concept', 'Recognize the missed-tech state and cash out with the position-appropriate punish.'),
    technique('diddy-video-pro-landing-bair', 'pro', 246, 0, 'Landing back-air pressure', ['Landing back air', 'Follow-up'], 'conditional', 'A landing bair starts continued pressure.', ['On-screen caveat: directional air dodge escapes the shown continuation.']),
    technique('diddy-video-pro-utilt-bair', 'pro', 256, 0, 'Up tilt into back air', ['Up tilt', 'Back air'], 'conditional', 'A horizontal finisher from the anti-air starter.', ['On-screen caveat: character dependent / not true.']),
    technique('diddy-video-pro-bair-banana', 'pro', 261, 0, 'Back air into banana toss', ['Back air', 'Banana toss', 'Conversion'], 'conditional', 'Use item release to continue pressure after the aerial.', ['On-screen caveat: not true / character dependent.']),
    technique('diddy-video-pro-utilt-pressure', 'pro', 271, 0, 'Up-tilt string into reaction punish', ['Up tilt', 'Up tilt', 'Aerial / air-dodge punish'], 'concept', 'The source treats the air dodge as a reactable escape that can be punished.'),
    technique('diddy-video-pro-frametrap', 'pro', 278, 0, 'Aerial frame-trap branch', ['Back air / Down air', 'Neutral air frame trap'], 'concept', 'The direct aerial link is not guaranteed, but the source demonstrates covering the escape timing.', ['On-screen caveat: the last fair and the back-air/down-air → nair links are not true.']),
    technique('diddy-video-pro-dtilt-pressure', 'pro', 288, 120, 'Down-tilt pressure string', ['Down tilt', 'Down tilt', 'Air-dodge punish'], 'concept', 'React to the directional air dodge after the tilt string instead of treating every hit as guaranteed.'),
    technique('diddy-video-pro-jablock-smash', 'pro', 296, 0, 'Banana jab-lock punish', ['Banana trip / knockdown', 'Jab lock', 'Smash attack'], 'concept', 'The source shows the item-created knockdown flowing into a jab lock and stock-taking punish.'),
    technique('diddy-video-pro-fthrow-bair', 'pro', 305, 0, 'Forward throw into back-air pressure', ['Forward throw', 'Back air', 'Back air'], 'source-not-true', 'Use this as an advantage route rather than a guaranteed string.', ['On-screen caveat: not true against DI out and directional air dodge.']),
    technique('diddy-video-pro-techchase', 'pro', 310, 0, 'Jab-lock to tech-chase tree', ['Jab lock', 'Tech chase', 'Positioned punish'], 'concept', 'The video follows the jab-lock idea with a broader tech-chase decision tree.'),
    technique('diddy-video-pro-uair-tight', 'pro', 319, 0, 'Falling back air into up-air ladder', ['Falling back air', 'Up air', 'Up air'], 'conditional', 'The starter and repeated up-air link both require precise timing.', ['On-screen caveats: falling back air is hard/not true; up air → up air has a tight window.']),
    technique('diddy-video-pro-platform-dair-read', 'pro', 328, 0, 'Platform reset into down-air read', ['Platform reset', 'Down air read', 'Follow-up'], 'concept', 'Down air covers the neutral-air-dodge response during the platform reset.'),
    technique('diddy-video-pro-double-toss', 'pro', 360, 90, 'Double banana toss', ['Banana toss', 'Re-catch / second toss', 'Conversion'], 'concept', 'Maintain item control through a second toss to extend the sequence.'),
    technique('diddy-video-pro-uptoss-dair', 'pro', 372, 90, 'Up-toss banana into down air', ['Banana up toss', 'Down air'], 'conditional', 'A vertical item setup into the downward aerial.', ['On-screen caveat: not true / character dependent on DI out.']),
    technique('diddy-video-pro-zdrop-smash', 'pro', 379, 90, 'Z-drop re-catch into smash attack', ['Z-drop', 'Re-catch', 'Smash attack'], 'concept', 'Use the re-catch state to preserve banana while confirming the grounded finisher.'),
    technique('diddy-video-pro-di-finishers', 'pro', 389, 20, 'DI-aware ladder finishers', ['Vertical ladder', 'Up air / Back air / Forward air'], 'conditional', 'Choose back air or forward air when DI moves the target out of the up-air lane.', ['The source calls the fair finisher more consistent on DI out.']),
    technique('diddy-video-pro-bair-toss-tight', 'pro', 427, 0, 'Back air into tight-window banana toss', ['Back air', 'Banana toss', 'Follow-up'], 'conditional', 'A late Pro variation of the item extension.', ['On-screen caveat: back air → banana toss has a tight window.']),

    technique('diddy-video-godlike-dact', 'godlike', 442, 80, 'Dash-attack-cancel mix-up', ['Dash-attack cancel', 'Down tilt / stutter-step forward smash'], 'concept', 'The first Godlike block explicitly contrasts d-tilt and stutter-step forward-smash branches.'),
    technique('diddy-video-godlike-footstool', 'godlike', 446, 0, 'Extended footstool route', ['Item starter', 'Footstool', 'Extended punish'], 'concept', 'A longer footstool conversion revisiting the Pro concept with more resources.'),
    technique('diddy-video-godlike-banana-stock', 'godlike', 470, 0, 'Banana stock route', ['Banana setup', 'Aerial / platform extension', 'Stock finisher'], 'concept', 'The “Mmm yummy bananas / We go bananas” blocks combine item control with platform and aerial continuations.'),
    technique('diddy-video-godlike-swag-kicks', 'godlike', 485, 0, 'Offstage aerial kick sequence', ['Aerial starter', 'Repeated kick edgeguard'], 'concept', 'The source labels this edgeguard block “Swag kicks to disrespect.”'),
    technique('diddy-video-godlike-ledgetrump', 'godlike', 495, 45, 'Run-off ledge-trump route', ['Run off', 'Ledge trump', 'Aerial punish'], 'concept', 'Force the ledge displacement and meet it with an immediate aerial.'),
    technique('diddy-video-godlike-zero-banana', 'godlike', 506, 0, 'Banana zero-to-death route', ['Banana starter', 'Extended aerial route', 'Stock'], 'concept', 'The video presents a full-stock training sequence beginning from banana.'),
    technique('diddy-video-godlike-popgun-read', 'godlike', 512, 20, 'Popgun-cancel air-dodge read', ['Popgun cancel', 'Air-dodge read', 'Punish'], 'concept', 'The cancel is used to bait and cover the defensive response.'),
    technique('diddy-video-godlike-zero-no-banana', 'godlike', 517, 0, 'No-banana zero-to-death route', ['Close-range starter', 'Extended aerial route', 'Stock'], 'concept', 'A second full-stock training sequence demonstrates a route without banana.'),
    technique('diddy-video-godlike-wario', 'godlike', 522, 45, 'Wario-specific stock route', ['Starter', 'Vertical extension', 'Stock'], 'concept', 'The source’s “We don’t like Wario” block is explicitly matchup-demonstrated rather than presented as universal.'),
    technique('diddy-video-godlike-shield-break', 'godlike', 544, 80, 'Banana shield-break setup', ['Banana pressure', 'Shield lock / damage', 'Shield break punish'], 'concept', 'Layer banana and close-range pressure to threaten the shield.'),
    technique('diddy-video-godlike-dair-confirm', 'godlike', 558, 0, 'High-damage down-air confirm family', ['Starter', 'Down air', 'Aerial / smash confirm'], 'concept', 'The “Look at that damage / We love downair confirms” blocks show multiple cash-outs from down air.'),
    technique('diddy-video-godlike-monkey-flip', 'godlike', 567, 0, 'Monkey Flip extension family', ['Starter', 'Monkey Flip', 'Aerial / stock branch'], 'concept', 'The video uses Monkey Flip as a route-changing extender across several demonstrations.'),
    technique('diddy-video-godlike-stock-tree', 'godlike', 581, 0, 'Multi-finisher stock tree', ['Starter', 'DI-aware extension', 'Stock finisher'], 'concept', 'The “Diddy Kong has so many ways to score stocks” block cycles through distinct finishing choices.'),
    technique('diddy-video-godlike-platform-banana', 'godlike', 603, 0, 'Up-toss banana platform resets', ['Banana up toss', 'Platform reset', 'Re-catch / aerial punish'], 'concept', 'A long block explores multiple reset positions and follow-ups under platforms.'),
    technique('diddy-video-godlike-ladder', 'godlike', 637, 0, 'Platform ladder combo', ['Platform starter', 'Up-air ladder', 'Finisher'], 'concept', 'Carry the target through the platform stack while preserving vertical alignment.'),
    technique('diddy-video-godlike-upb', 'godlike', 645, 20, 'Rocketbarrel combo finish', ['Starter', 'Rocketbarrel Boost (Up-B)'], 'concept', 'The final major block demonstrates the high-damage Up-B cash-out.'),
    technique('diddy-video-godlike-final', 'godlike', 651, 0, 'Final aerial damage route', ['Aerial starter', 'Aerial follow-up'], 'concept', 'The source closes its gameplay section with one final compact damage conversion.'),
  ],
} as const satisfies TechniqueProgression
