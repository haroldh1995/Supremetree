import { useMemo, useState } from 'react'
import { livingAnswerDefinition, powerDefinitions } from '../data/powers'
import { useAppState } from '../state/AppState'
import { Button, ErrorMessage, Field, Panel, SelectInput, TextInput } from './common'

const steps = [
  'Welcome',
  'Campaign Name',
  'Campaign Start',
  'Target Date',
  'Session Frequency',
  'Weekly Session Day',
  'Catch-Up Behavior',
  'Power List Review',
  'Convergence Engine',
  'Living Answer',
  'Finish',
]

function addMonthsIso(date: string, months: number): string {
  const current = new Date(`${date}T00:00:00`)
  current.setMonth(current.getMonth() + months)
  return current.toISOString().slice(0, 10)
}

export function OnboardingWizard() {
  const { actions } = useAppState()
  const today = useMemo(() => new Date().toISOString().slice(0, 10), [])
  const [step, setStep] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [campaignName, setCampaignName] = useState('Dumare Campaign')
  const [startDate, setStartDate] = useState(today)
  const [targetDate, setTargetDate] = useState(addMonthsIso(today, 12))
  const [expectedSessionsPerMonth, setExpectedSessionsPerMonth] = useState(4)
  const [weeklySessionDay, setWeeklySessionDay] = useState(6)
  const [catchUpRequiresApproval, setCatchUpRequiresApproval] = useState(true)

  async function finish() {
    try {
      if (new Date(targetDate) <= new Date(startDate)) {
        setError('The Living Answer target date must be after the campaign start date.')
        return
      }
      await actions.createCampaign({
        campaignName,
        startDate,
        targetDate,
        expectedSessionsPerMonth,
        weeklySessionDay,
        catchUpRequiresApproval,
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Campaign setup failed.')
    }
  }

  return (
    <main className="onboarding">
      <Panel className="onboarding-panel">
        <div className="step-list" aria-label="Setup steps">
          {steps.map((label, index) => (
            <button
              key={label}
              type="button"
              className={index === step ? 'active' : ''}
              onClick={() => setStep(index)}
            >
              {index + 1}. {label}
            </button>
          ))}
        </div>
        <section className="wizard-body">
          <ErrorMessage message={error} />
          {step === 0 ? (
            <>
              <h1>Dumare: Power Realization Tracker</h1>
              <p>
                This local-first ledger preserves randomized power acquisition while protecting the
                campaign timeline from missed sessions and bad luck.
              </p>
            </>
          ) : null}
          {step === 1 ? (
            <Field label="Campaign name">
              <TextInput
                value={campaignName}
                onChange={(event) => setCampaignName(event.target.value)}
              />
            </Field>
          ) : null}
          {step === 2 ? (
            <Field label="Campaign start date">
              <TextInput
                type="date"
                value={startDate}
                onChange={(event) => setStartDate(event.target.value)}
              />
            </Field>
          ) : null}
          {step === 3 ? (
            <Field label="Target Living Answer date">
              <TextInput
                type="date"
                value={targetDate}
                onChange={(event) => setTargetDate(event.target.value)}
              />
            </Field>
          ) : null}
          {step === 4 ? (
            <Field label="Expected sessions per month">
              <TextInput
                type="number"
                min={1}
                max={12}
                value={expectedSessionsPerMonth}
                onChange={(event) => setExpectedSessionsPerMonth(Number(event.target.value))}
              />
            </Field>
          ) : null}
          {step === 5 ? (
            <Field label="Default weekly session day">
              <SelectInput
                value={weeklySessionDay}
                onChange={(event) => setWeeklySessionDay(Number(event.target.value))}
              >
                {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map(
                  (day, index) => (
                    <option key={day} value={index}>
                      {day}
                    </option>
                  ),
                )}
              </SelectInput>
            </Field>
          ) : null}
          {step === 6 ? (
            <fieldset className="choice-group">
              <legend>Catch-up behavior</legend>
              <label>
                <input
                  type="radio"
                  checked={catchUpRequiresApproval}
                  onChange={() => setCatchUpRequiresApproval(true)}
                />
                Catch-up credits require DM approval
              </label>
              <label>
                <input
                  type="radio"
                  checked={!catchUpRequiresApproval}
                  onChange={() => setCatchUpRequiresApproval(false)}
                />
                Catch-up credits can be applied automatically
              </label>
            </fieldset>
          ) : null}
          {step === 7 ? (
            <>
              <h2>Canonical power list from the uploaded DOCX</h2>
              <div className="review-list">
                {powerDefinitions.map((power) => (
                  <span key={power.id}>
                    {power.displayNumber}. {power.name}
                  </span>
                ))}
              </div>
            </>
          ) : null}
          {step === 8 ? (
            <>
              <h2>Convergence Engine behavior</h2>
              <p>
                Convergence Engine is milestone controlled. It synchronizes powers Dumare has
                already manifested and is excluded from ordinary random draws.
              </p>
            </>
          ) : null}
          {step === 9 ? (
            <>
              <h2>The Living Answer requirements</h2>
              <p>{livingAnswerDefinition.unlockRequirement}</p>
              <p>The mana battery full function remains emergency-only and separate.</p>
            </>
          ) : null}
          {step === 10 ? (
            <>
              <h2>Review and create campaign</h2>
              <dl className="summary-list">
                <dt>Name</dt>
                <dd>{campaignName}</dd>
                <dt>Start</dt>
                <dd>{startDate}</dd>
                <dt>Target</dt>
                <dd>{targetDate}</dd>
                <dt>Sessions per month</dt>
                <dd>{expectedSessionsPerMonth}</dd>
              </dl>
            </>
          ) : null}
          <div className="wizard-actions">
            <Button type="button" variant="ghost" onClick={() => setStep(Math.max(0, step - 1))}>
              Back
            </Button>
            {step < steps.length - 1 ? (
              <Button
                type="button"
                variant="primary"
                onClick={() => setStep(Math.min(steps.length - 1, step + 1))}
              >
                Continue
              </Button>
            ) : (
              <Button type="button" variant="primary" onClick={() => void finish()}>
                Create Campaign
              </Button>
            )}
          </div>
        </section>
      </Panel>
    </main>
  )
}
