import type { ProCharacterIndexedCoverageSet } from './proLabIndexedCoverageM73A'

const vod = (
  id: string,
  event: string,
  playerTag: string,
  opponentTag: string,
  fighterIds: readonly string[],
  date: string,
): ProCharacterIndexedCoverageSet => ({
  id: `m74-index-${id}`,
  title: `${event} - ${playerTag} vs ${opponentTag} [${fighterIds.join(', ')} character index]`,
  playerTag,
  playerFighterIds: [],
  opponentTag,
  opponentFighterIds: [],
  indexedFighterIds: fighterIds,
  date,
  sourceUrls: [
    `https://smasharchives.com/vod/${id}`,
    `https://www.youtube.com/watch?v=${id}`,
  ],
  evidenceStatus: 'source-index',
})

/**
 * First M74 12-set-floor batch. Six distinct public match-video records close
 * the complete Bowser Jr. and Ike acquisition gaps together; the two additional
 * confirmed sparse-fighter appearances are retained without inferring sides.
 */
export const proIndexedCoverageM74A = [
  vod('dUL6dYXwwSU', 'SSO 43', 'Dracyo', 'Xillion', ['bowser-jr', 'ike', 'corrin'], '2021-08-09'),
  vod('ewFs0EUdRNw', 'S@X 375 SSBU', 'Captyn', 'rm8', ['bowser-jr', 'ike'], '2020-10-14'),
  vod('ufO77FX2dR4', 'AON Ultimate 63', 'Stimulating Fly', 'Ragnellrok', ['bowser-jr', 'ike'], '2020-03-04'),
  vod('4D_at3Gq_OI', 'Smash Ultimate Tournament', 'VerticalHunger', 'HaKai', ['bowser-jr', 'ike'], '2020-01-29'),
  vod('gZCyn5geWcU', 'CGC 2019 SSBU', 'Odd4Luz', 'Reridse', ['bowser-jr', 'ike', 'lucina'], '2019-12-16'),
  vod('VKSInFAPvSs', 'USW 27', 'Brr', 'MadIke', ['bowser-jr', 'ike'], '2019-06-14'),
] as const satisfies readonly ProCharacterIndexedCoverageSet[]
