import './FighterGlyph.css'

function hashName(value: string) {
  let hash = 2166136261
  for (const character of value) {
    hash ^= character.charCodeAt(0)
    hash = Math.imul(hash, 16777619)
  }
  return hash >>> 0
}

export function FighterGlyph({ name, compact = false }: { name: string; compact?: boolean }) {
  const hash = hashName(name)
  const initials = name.split(/\s|&/).filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join('')
  const x = 24 + (hash % 52)
  const y = 24 + ((hash >>> 7) % 52)
  const radius = 10 + ((hash >>> 13) % 16)
  const angle = (hash >>> 18) % 360

  return (
    <span className={`fighter-glyph${compact ? ' fighter-glyph--compact' : ''}`} aria-hidden="true">
      <svg viewBox="0 0 100 100" focusable="false">
        <circle className="fighter-glyph__ring" cx="50" cy="50" r="40" />
        <circle className="fighter-glyph__node" cx={x} cy={y} r={radius} />
        <path className="fighter-glyph__axis" d={`M50 10 L50 90 M10 50 L90 50`} transform={`rotate(${angle} 50 50)`} />
        <circle className="fighter-glyph__core" cx="50" cy="50" r="13" />
      </svg>
      <strong>{initials}</strong>
    </span>
  )
}
