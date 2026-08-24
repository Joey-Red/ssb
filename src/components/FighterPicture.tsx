import type { CSSProperties } from 'react'
import { officialFighterRenderUrl, officialFighterThumbUrl } from '../data/officialFighterAssets'
import { FighterGlyph } from './FighterGlyph'

const accents = ['#e94335', '#2676d2', '#f6c945', '#3aa65d', '#9b57c7', '#ef7a2c'] as const

function colorIndex(value: string, offset = 0) {
  let hash = offset
  for (const character of value) hash = (Math.imul(hash ^ character.charCodeAt(0), 16777619)) >>> 0
  return hash % accents.length
}

export function FighterPicture({ fighterId, name, series, compact = false }: { fighterId: string; name: string; series: string; compact?: boolean }) {
  const accent = accents[colorIndex(name)]
  const secondary = accents[colorIndex(series, 97)]
  const style = {
    '--portrait-accent': accent,
    '--portrait-secondary': secondary,
  } as CSSProperties
  const imageUrl = compact ? officialFighterThumbUrl(fighterId) : officialFighterRenderUrl(fighterId)

  return (
    <figure className={`fighter-picture${compact ? ' fighter-picture--compact' : ''}`} style={style} aria-label={`${name} character art`}>
      <div className="fighter-picture__fallback" aria-hidden="true"><FighterGlyph name={name} /></div>
      <img
        className="fighter-picture__render"
        src={imageUrl}
        alt={`${name} official Super Smash Bros. Ultimate render`}
        loading="lazy"
        decoding="async"
        referrerPolicy="no-referrer"
        onError={(event) => { event.currentTarget.hidden = true }}
      />
      <figcaption className="fighter-picture__label"><strong>{name}</strong><span>{series}</span></figcaption>
    </figure>
  )
}
