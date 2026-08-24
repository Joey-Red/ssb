import type { CSSProperties } from 'react'
import { FighterGlyph } from './FighterGlyph'

const accents = ['#e94335', '#2676d2', '#f6c945', '#3aa65d', '#9b57c7', '#ef7a2c'] as const

function colorIndex(value: string, offset = 0) {
  let hash = offset
  for (const character of value) hash = (Math.imul(hash ^ character.charCodeAt(0), 16777619)) >>> 0
  return hash % accents.length
}

export function FighterPicture({ name, series, compact = false }: { name: string; series: string; compact?: boolean }) {
  const accent = accents[colorIndex(name)]
  const secondary = accents[colorIndex(series, 97)]
  const style = {
    '--portrait-accent': accent,
    '--portrait-secondary': secondary,
  } as CSSProperties

  return (
    <figure className={`fighter-picture${compact ? ' fighter-picture--compact' : ''}`} style={style} aria-label={`${name} visual identity`}>
      <div className="fighter-picture__glyph"><FighterGlyph name={name} /></div>
      <figcaption className="fighter-picture__label"><strong>{name}</strong><span>{series}</span></figcaption>
    </figure>
  )
}
