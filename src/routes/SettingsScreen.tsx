import { useEffect, useState } from 'react'
import {
  Button,
  ErrorMessage,
  Field,
  PageHeader,
  Panel,
  SelectInput,
  TextInput,
} from '../components/common'
import type { CampaignSettings } from '../domain/types'
import { useAppState } from '../state/AppState'

export function SettingsScreen() {
  const { data, actions } = useAppState()
  const [settings, setSettings] = useState<CampaignSettings | null>(data.settings)
  const [error, setError] = useState<string | null>(null)
  const [dmUnlocked, setDmUnlocked] = useState(false)
  const [pin, setPin] = useState('')

  useEffect(() => {
    setSettings(data.settings)
  }, [data.settings])

  if (!settings) return null

  function patch<T extends keyof CampaignSettings>(key: T, value: CampaignSettings[T]) {
    setSettings((current) => (current ? { ...current, [key]: value } : current))
  }

  async function save() {
    if (!settings) return
    if (new Date(settings.targetDate) <= new Date(settings.startDate)) {
      setError('Target date must be after the campaign start date.')
      return
    }
    try {
      await actions.updateSettings(settings, 'Settings saved from Settings screen.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Settings could not be saved.')
    }
  }

  function unlockDm() {
    if (!settings) return
    if (!settings.dmPin || pin === settings.dmPin) setDmUnlocked(true)
    else setError('PIN did not match. This is a local convenience lock, not high-security auth.')
  }

  return (
    <div className="screen-stack">
      <PageHeader
        title="Settings"
        description="Campaign dates, pacing, safeguards, display, backup, and local DM lock."
      />
      <ErrorMessage message={error} />
      <Panel>
        <h2>Campaign Dates and Pacing</h2>
        <div className="form-grid">
          <Field label="Campaign name">
            <TextInput
              value={settings.campaignName}
              onChange={(event) => patch('campaignName', event.target.value)}
            />
          </Field>
          <Field label="Start date">
            <TextInput
              type="date"
              value={settings.startDate}
              onChange={(event) => patch('startDate', event.target.value)}
            />
          </Field>
          <Field label="Target date">
            <TextInput
              type="date"
              value={settings.targetDate}
              onChange={(event) => patch('targetDate', event.target.value)}
            />
          </Field>
          <Field label="Expected sessions per month">
            <TextInput
              type="number"
              min={1}
              value={settings.expectedSessionsPerMonth}
              onChange={(event) => patch('expectedSessionsPerMonth', Number(event.target.value))}
            />
          </Field>
          <Field label="Ordinary completion month">
            <TextInput
              type="number"
              min={1}
              max={12}
              value={settings.ordinaryCompletionMonth}
              onChange={(event) => patch('ordinaryCompletionMonth', Number(event.target.value))}
            />
          </Field>
          <Field label="Convergence month">
            <TextInput
              type="number"
              min={1}
              max={12}
              value={settings.convergenceCompletionMonth}
              onChange={(event) => patch('convergenceCompletionMonth', Number(event.target.value))}
            />
          </Field>
          <Field label="Living Answer reveal month">
            <TextInput
              type="number"
              min={1}
              max={12}
              value={settings.livingAnswerRevealMonth}
              onChange={(event) => patch('livingAnswerRevealMonth', Number(event.target.value))}
            />
          </Field>
          <Field label="Cooldown advancements">
            <TextInput
              type="number"
              min={0}
              value={settings.cooldownAdvancements}
              onChange={(event) => patch('cooldownAdvancements', Number(event.target.value))}
            />
          </Field>
        </div>
      </Panel>
      <Panel>
        <h2>Safeguards and Interface</h2>
        <div className="check-row">
          <label>
            <input
              type="checkbox"
              checked={settings.catchUpRequiresApproval}
              onChange={(event) => patch('catchUpRequiresApproval', event.target.checked)}
            />
            Catch-up credits require DM approval
          </label>
          <label>
            <input
              type="checkbox"
              checked={settings.automaticCatchUpCredits}
              onChange={(event) => patch('automaticCatchUpCredits', event.target.checked)}
            />
            Generate catch-up credits after missed sessions
          </label>
          <label>
            <input
              type="checkbox"
              checked={settings.tierGatingEnabled}
              onChange={(event) => patch('tierGatingEnabled', event.target.checked)}
            />
            Tier gating
          </label>
          <label>
            <input
              type="checkbox"
              checked={settings.sameSessionDuplicateRequiresOverride}
              onChange={(event) =>
                patch('sameSessionDuplicateRequiresOverride', event.target.checked)
              }
            />
            Same-session duplicate requires override
          </label>
          <label>
            <input
              type="checkbox"
              checked={settings.soundEffects}
              onChange={(event) => patch('soundEffects', event.target.checked)}
            />
            Sound effects
          </label>
        </div>
        <div className="form-grid">
          <Field label="Animation">
            <SelectInput
              value={settings.animationLevel}
              onChange={(event) =>
                patch('animationLevel', event.target.value as CampaignSettings['animationLevel'])
              }
            >
              <option value="full">Full</option>
              <option value="reduced">Reduced</option>
              <option value="none">None</option>
            </SelectInput>
          </Field>
          <Field label="Appearance">
            <SelectInput
              value={settings.appearance}
              onChange={(event) =>
                patch('appearance', event.target.value as CampaignSettings['appearance'])
              }
            >
              <option value="dark">Dark</option>
              <option value="light">Light</option>
              <option value="system">System</option>
            </SelectInput>
          </Field>
          <Field label="Density">
            <SelectInput
              value={settings.density}
              onChange={(event) =>
                patch('density', event.target.value as CampaignSettings['density'])
              }
            >
              <option value="comfortable">Comfortable</option>
              <option value="compact">Compact</option>
            </SelectInput>
          </Field>
        </div>
      </Panel>
      <Panel>
        <h2>DM Controls Lock</h2>
        <p>This local PIN is a convenience lock only. It is not account authentication.</p>
        <div className="form-grid">
          <Field label="Enter PIN">
            <TextInput
              type="password"
              value={pin}
              onChange={(event) => setPin(event.target.value)}
            />
          </Field>
          <Button variant="secondary" onClick={unlockDm}>
            Unlock DM Controls
          </Button>
          {dmUnlocked ? (
            <Field label="New local PIN">
              <TextInput
                value={settings.dmPin ?? ''}
                onChange={(event) => patch('dmPin', event.target.value || undefined)}
              />
            </Field>
          ) : null}
        </div>
      </Panel>
      <Button variant="primary" onClick={() => void save()}>
        Save Settings
      </Button>
    </div>
  )
}
