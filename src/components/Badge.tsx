import type { ComboKind, Confidence } from '../types'

const kindLabels: Record<ComboKind,string> = { true:'True','kill-confirm':'Kill confirm','di-dependent':'DI dependent','character-dependent':'Character dependent','practice-route':'Practice route' }
export function ComboKindBadge({kind}:{kind:ComboKind}){return <span className={`badge badge--${kind}`}>{kindLabels[kind]}</span>}
export function ConfidenceBadge({confidence}:{confidence:Confidence}){return <span className={`confidence confidence--${confidence}`}><span className="confidence-dot" aria-hidden="true"/>{confidence==='verified'?'Source-backed':'Lab review'}</span>}
