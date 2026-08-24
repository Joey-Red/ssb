import { useMemo, useState } from 'react'
import { guideByFighterId } from '../data/allGuides'
import { fighterById, roster } from '../data/roster'
import { RouteLine } from './RouteLine'
import './MatchupLab.css'

function archetypeFocus(archetype: string): readonly string[] {
  const lower = archetype.toLowerCase()
  if (/(zon|projectile|trap|keepaway)/.test(lower)) return [
    'Drill walking, shielding and platform movement through projectile lanes without autopilot jumping.',
    'Record which of your moves safely claim space after the opponent commits to a ranged option.',
    'Practice ledge escape against lingering coverage instead of treating neutral and ledge as the same problem.',
  ]
  if (/(rush|pressure|brawl|close-range|speed)/.test(lower)) return [
    'Drill holding burst range and checking dash/jump approaches with your lowest-commitment buttons.',
    'Practice one defensive reset after blocking pressure instead of immediately swinging every time.',
    'Track which openings are real punishes versus scramble wins; fast characters punish false turns.',
  ]
  if (/(sword|range|spacing|disjoint)/.test(lower)) return [
    'Practice standing just outside the opponent’s preferred swing range and whiff-punishing the recovery.',
    'Use stage position as the goal: do not trade repeatedly just to prove you can challenge the disjoint.',
    'At ledge, drill patient escape timing against broad aerial coverage.',
  ]
  if (/(heavy|power|grappl|command grab)/.test(lower)) return [
    'Practice low-commitment advantage: take guaranteed damage and keep stage control rather than overextending.',
    'Drill throw/command-grab awareness from shield and landing situations.',
    'At high percent, rehearse survival DI and recovery mixups before searching for extra damage.',
  ]
  if (/(float|aerial|air|juggle)/.test(lower)) return [
    'Practice anti-air timing and meeting landings without chasing the opponent’s current position too early.',
    'Vary your own landing drift, fast-fall timing and defensive option so juggle defense is not one pattern.',
    'Use platforms deliberately: decide whether they are an escape route or another layer of disadvantage.',
  ]
  return [
    'Identify the opponent’s safest neutral starter and drill the range where it first becomes threatening.',
    'Practice one clean advantage conversion and one clean disadvantage escape before adding matchup-specific tricks.',
    'Review ledge and recovery interactions separately from center-stage neutral.',
  ]
}

export function MatchupLab({ fighterId }: { fighterId: string }) {
  const initialOpponent = roster.find((entry) => entry.id !== fighterId)?.id ?? fighterId
  const [opponentId, setOpponentId] = useState(initialOpponent)
  const fighter = fighterById.get(fighterId)
  const opponent = fighterById.get(opponentId)
  const fighterGuide = guideByFighterId.get(fighterId)
  const opponentGuide = opponent ? guideByFighterId.get(opponent.id) : undefined

  const diRoutes = useMemo(() => fighterGuide?.combos.filter((combo) =>
    combo.kind === 'di-dependent' || combo.conditions?.some((condition) => /\bDI\b/i.test(condition)),
  ).slice(0, 4) ?? [], [fighterGuide])

  if (!fighter || !opponent || !opponentGuide) return null
  const focus = archetypeFocus(opponentGuide.archetype)

  return (
    <section className="panel matchup-lab" aria-labelledby="matchup-lab-title">
      <div className="section-heading matchup-heading">
        <div><p className="eyebrow">Matchup / DI lab</p><h2 id="matchup-lab-title">Train the interaction, not a tier number</h2></div>
        <label><span>Opponent</span><select value={opponentId} onChange={(event) => setOpponentId(event.target.value)}>{roster.filter((entry) => entry.id !== fighterId).map((entry) => <option key={entry.id} value={entry.id}>{entry.name}</option>)}</select></label>
      </div>

      <div className="matchup-grid">
        <article>
          <p className="eyebrow">{fighter.name} vs {opponent.name}</p>
          <h3>{opponentGuide.archetype}</h3>
          <ol>{focus.map((item) => <li key={item}>{item}</li>)}</ol>
        </article>
        <article>
          <p className="eyebrow">DI checklist</p>
          <h3>Test the launch you actually got</h3>
          <ul>
            <li><strong>DI:</strong> changes launch trajectory. The useful direction depends on the move, percent, stage position and blast-zone geometry.</li>
            <li><strong>SDI:</strong> happens during hitlag; rehearse it against multi-hits rather than treating it as ordinary DI.</li>
            <li><strong>Combo defense:</strong> test both common DI directions and record where the attacker must change the route.</li>
            <li><strong>Survival:</strong> do not memorize “always hold in/out.” Reproduce the specific kill move and position in Training Mode.</li>
          </ul>
        </article>
      </div>

      {diRoutes.length > 0 && <div className="di-route-strip"><div><p className="eyebrow">Your DI-sensitive routes</p><p>These existing guide routes already document DI as a condition.</p></div><div>{diRoutes.map((combo) => <div className="di-route" key={combo.id}><RouteLine route={combo.route} compact/><span>{combo.minPercent}–{combo.maxPercent}% · {combo.kind}</span></div>)}</div></div>}
      <p className="matchup-disclaimer">This is a practice planner, not a claimed matchup chart. It derives drills from documented fighter archetypes and your existing route conditions; it does not assign matchup scores.</p>
    </section>
  )
}
