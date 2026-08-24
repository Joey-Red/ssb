import { useEffect } from 'react'
import { guideByFighterId } from '../data/allGuides'
import { fighterBySlug, roster } from '../data/roster'
import {
  incrementPracticeRep,
  recordRecent,
  resetPractice,
  setPracticeStep,
  togglePracticeComplete,
  useLocalState,
} from '../lib/storage'
import { hrefFor } from '../router'
import { RouteLine } from './RouteLine'
import './TrainingLadder.css'
import './PracticeView.css'

export function PracticeView({ slug }: { slug: string }) {
  const fighter = fighterBySlug.get(slug)
  const localState = useLocalState()
  const guide = fighter ? guideByFighterId.get(fighter.id) : undefined
  const steps = guide?.trainingRoutine ?? []
  const saved = fighter ? localState.practice[fighter.id] : undefined
  const rawIndex = saved?.stepIndex ?? 0
  const stepIndex = steps.length > 0 ? Math.max(0, Math.min(steps.length - 1, rawIndex)) : 0
  const currentStep = steps[stepIndex]
  const fighterId = fighter?.id
  const currentPercent = currentStep?.percent

  useEffect(() => {
    if (fighterId) recordRecent(fighterId)
  }, [fighterId])

  useEffect(() => {
    if (!fighterId || currentPercent === undefined || steps.length === 0) return

    const activeFighterId = fighterId
    const activePercent = currentPercent
    const stepCount = steps.length

    function onKeyDown(event: globalThis.KeyboardEvent) {
      const target = event.target as HTMLElement | null
      if (target?.closest('input, select, textarea, button, a')) return

      if (event.key === 'ArrowLeft') {
        event.preventDefault()
        const next = Math.max(0, stepIndex - 1)
        setPracticeStep(activeFighterId, next)
      } else if (event.key === 'ArrowRight') {
        event.preventDefault()
        const next = Math.min(stepCount - 1, stepIndex + 1)
        setPracticeStep(activeFighterId, next)
      } else if (event.key.toLowerCase() === 'r') {
        event.preventDefault()
        incrementPracticeRep(activeFighterId, activePercent)
      } else if (event.key.toLowerCase() === 'c') {
        event.preventDefault()
        togglePracticeComplete(activeFighterId, activePercent)
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [currentPercent, fighterId, stepIndex, steps.length])

  if (!fighter || !guide) {
    return (
      <section className="panel empty-state">
        <span className="empty-state__icon" aria-hidden="true">?</span>
        <h1>Practice guide unavailable</h1>
        <p>Choose a fighter with guide data from the roster.</p>
        <a className="button-link" href={hrefFor('/')}>Return to roster</a>
      </section>
    )
  }

  if (!currentStep) {
    return <section className="panel empty-state"><h1>No practice steps</h1><p>This guide needs a training routine.</p></section>
  }

  const activeFighterId = fighter.id
  const repetitions = saved?.repetitions[String(currentStep.percent)] ?? 0
  const completed = saved?.completed.includes(currentStep.percent) ?? false

  function move(delta: number) {
    const next = Math.max(0, Math.min(steps.length - 1, stepIndex + delta))
    setPracticeStep(activeFighterId, next)
  }

  function selectFighter(nextSlug: string) {
    window.location.hash = `/practice/${nextSlug}`
  }

  return (
    <div className="practice-page">
      <section className="practice-header panel">
        <div>
          <p className="eyebrow">Focused practice</p>
          <h1>{fighter.name}</h1>
          <p className="hero-copy">One percentage at a time. Follow the route, record reps, mark the step complete, then move forward.</p>
        </div>
        <div className="practice-header__controls">
          <label>
            <span>Fighter</span>
            <select value={fighter.slug} onChange={(event) => selectFighter(event.target.value)}>
              {roster.map((entry) => <option key={entry.id} value={entry.slug}>{entry.name}</option>)}
            </select>
          </label>
          <a className="button-link" href={hrefFor(`/fighter/${fighter.slug}`)}>Full guide</a>
        </div>
      </section>

      <section className="panel practice-workspace" aria-labelledby="practice-step-title">
        <div className="section-heading practice-heading">
          <div>
            <p className="eyebrow">Current drill</p>
            <h2 id="practice-step-title">{currentStep.percent}%</h2>
          </div>
          <span className="practice-counter">Step {stepIndex + 1} / {steps.length}</span>
        </div>

        <div className="practice-percent-strip" aria-label="Practice percentages">
          {steps.map((step, index) => {
            const isComplete = saved?.completed.includes(step.percent) ?? false
            return (
              <button
                type="button"
                className={`practice-percent${index === stepIndex ? ' is-active' : ''}${isComplete ? ' is-complete' : ''}`}
                key={step.percent}
                onClick={() => setPracticeStep(activeFighterId, index)}
                aria-current={index === stepIndex ? 'step' : undefined}
              >
                <span>{step.percent}%</span>
                {isComplete && <small>done</small>}
              </button>
            )
          })}
        </div>

        <article className="practice-focus-card">
          <div className="practice-focus-card__percent" aria-hidden="true">{currentStep.percent}%</div>
          <div className="practice-focus-card__body">
            <RouteLine route={currentStep.route} />
            <h3>{currentStep.purpose}</h3>
            {currentStep.notes && <p>{currentStep.notes}</p>}
          </div>
        </article>

        <div className="practice-actions">
          <button type="button" onClick={() => move(-1)} disabled={stepIndex === 0}>← Previous</button>
          <button type="button" className="practice-rep" onClick={() => incrementPracticeRep(activeFighterId, currentStep.percent)}>
            <strong>{repetitions}</strong><span>Add rep <kbd>R</kbd></span>
          </button>
          <button type="button" className={completed ? 'is-complete' : ''} onClick={() => togglePracticeComplete(activeFighterId, currentStep.percent)}>
            {completed ? '✓ Completed' : 'Mark complete'} <kbd>C</kbd>
          </button>
          <button type="button" onClick={() => move(1)} disabled={stepIndex === steps.length - 1}>Next →</button>
        </div>

        <div className="practice-footer">
          <p><kbd>←</kbd>/<kbd>→</kbd> change step · <kbd>R</kbd> add rep · <kbd>C</kbd> toggle complete</p>
          <button type="button" onClick={() => resetPractice(activeFighterId)}>Reset {fighter.name} practice</button>
        </div>
      </section>
    </div>
  )
}
