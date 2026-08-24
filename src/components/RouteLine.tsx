interface RouteLineProps { route: readonly string[]; compact?: boolean }

export function RouteLine({ route, compact = false }: RouteLineProps) {
  return <div className={`route-line${compact ? ' route-line--compact' : ''}`} aria-label={route.join(' then ')}>{route.map((step,index)=><span className="route-part" key={`${step}-${index}`}>{index>0&&<span className="route-arrow" aria-hidden="true">→</span>}<span className="route-chip">{step}</span></span>)}</div>
}
