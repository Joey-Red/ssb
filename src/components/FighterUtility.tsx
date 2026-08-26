import { useEffect } from 'react'
import { recordRecent, toggleFavorite, useLocalState } from '../lib/storage'
import { hrefFor } from '../router'
import './FighterUtility.css'

interface FighterUtilityProps {
  fighterId: string
  fighterSlug: string
  fighterName: string
  totalSteps: number
}

export function FighterUtility({ fighterId, fighterSlug, fighterName, totalSteps }: FighterUtilityProps) {
  const localState = useLocalState()
  const favorite = localState.favorites.includes(fighterId)
  const completed = localState.practice[fighterId]?.completed.length ?? 0

  useEffect(() => {
    recordRecent(fighterId)
  }, [fighterId])

  return (
    <nav className="fighter-utility" aria-label={`${fighterName} actions`}>
      <button
        type="button"
        className={`fighter-utility__favorite${favorite ? ' is-active' : ''}`}
        aria-pressed={favorite}
        onClick={() => toggleFavorite(fighterId)}
      >
        <span aria-hidden="true">{favorite ? '★' : '☆'}</span>
        {favorite ? 'Favorite' : 'Add favorite'}
      </button>
      <a className="fighter-utility__moves" href={hrefFor(`/fighter/${fighterSlug}/moves`)}>
        <span aria-hidden="true">▦</span>
        All move playbacks
      </a>
      <a className="fighter-utility__practice" href={hrefFor(`/practice/${fighterSlug}`)}>
        <span aria-hidden="true">▶</span>
        Practice mode
      </a>
      <span className="fighter-utility__progress" aria-live="polite">
        {completed}/{totalSteps} drills complete
      </span>
    </nav>
  )
}
