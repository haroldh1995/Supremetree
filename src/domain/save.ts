import {
  APP_VERSION,
  CANONICAL_DATA_HASH,
  CANONICAL_DATA_VERSION,
  COMPATIBLE_CANONICAL_DATA_HASHES,
  SAVE_SCHEMA_VERSION,
  powers,
} from '../data/powers'
import type { AppProgress, PowerState, SavePayload } from './types'

const powerStates = new Set<PowerState>(['unmanifested', 'first_manifestation', 'fully_manifested'])

const livingStates = new Set(['locked', 'available', 'revealed'])

export function createSavePayload(
  progress: AppProgress,
  savedAt = new Date().toISOString(),
): SavePayload {
  return {
    schemaVersion: SAVE_SCHEMA_VERSION,
    appVersion: APP_VERSION,
    savedAt,
    canonicalDataVersion: CANONICAL_DATA_VERSION,
    canonicalDataHash: CANONICAL_DATA_HASH,
    progress,
  }
}

export function getSaveFilename(date = new Date()): string {
  const stamp = date
    .toISOString()
    .replace(/[-:]/g, '')
    .replace(/\.\d{3}Z$/, '')
    .replace('T', '-')
  return `dumare-supreme-power-tree-save-${stamp}.json`
}

export function parseSaveFile(text: string): SavePayload {
  let parsed: unknown
  try {
    parsed = JSON.parse(text)
  } catch {
    throw new Error('The selected file is not valid JSON.')
  }
  return validateSavePayload(parsed)
}

export function validateSavePayload(value: unknown): SavePayload {
  if (!isRecord(value)) {
    throw new Error('Save file must contain a JSON object.')
  }

  if (value.schemaVersion !== SAVE_SCHEMA_VERSION) {
    throw new Error('Unsupported save schema version.')
  }
  const canonicalDataHash =
    typeof value.canonicalDataHash === 'string' ? value.canonicalDataHash : ''
  if (!COMPATIBLE_CANONICAL_DATA_HASHES.some((hash) => hash === canonicalDataHash)) {
    throw new Error('This save was created for different canonical power data.')
  }
  if (typeof value.savedAt !== 'string') {
    throw new Error('Save timestamp is missing.')
  }
  if (!isRecord(value.progress)) {
    throw new Error('Save progress data is missing.')
  }

  validateProgress(value.progress)
  return value as SavePayload
}

function validateProgress(progress: Record<string, unknown>): void {
  if (!isRecord(progress.powers)) {
    throw new Error('Power progress is missing.')
  }

  for (const power of powers) {
    const powerProgress = progress.powers[power.id]
    if (!isRecord(powerProgress)) {
      throw new Error(`Progress for ${power.name} is missing.`)
    }
    if (powerProgress.powerId !== power.id) {
      throw new Error(`Progress record for ${power.name} has the wrong power id.`)
    }
    if (typeof powerProgress.selectionCount !== 'number') {
      throw new Error(`Manifestation count for ${power.name} is invalid.`)
    }
    if (!powerStates.has(powerProgress.state as PowerState)) {
      throw new Error(`State for ${power.name} is invalid.`)
    }
    validateSelectionCount(
      power.name,
      powerProgress.state as PowerState,
      powerProgress.selectionCount,
    )
  }

  if (!Array.isArray(progress.history)) {
    throw new Error('Manifestation history must be an array.')
  }

  for (const entry of progress.history) {
    if (!isRecord(entry)) {
      throw new Error('History entries must be objects.')
    }
    if (typeof entry.sequence !== 'number' || typeof entry.powerId !== 'string') {
      throw new Error('History entry sequence or power id is invalid.')
    }
    if (!powers.some((power) => power.id === entry.powerId)) {
      throw new Error(`History references an unknown power: ${entry.powerId}`)
    }
  }

  if (!isRecord(progress.cooldown)) {
    throw new Error('Cooldown state is missing.')
  }

  const blockedPowerId = progress.cooldown.blockedPowerId
  if (
    blockedPowerId !== undefined &&
    (typeof blockedPowerId !== 'string' || !powers.some((power) => power.id === blockedPowerId))
  ) {
    throw new Error('Cooldown references an unknown power.')
  }

  if (!isRecord(progress.livingAnswer)) {
    throw new Error('The Living Answer state is missing.')
  }
  if (!livingStates.has(String(progress.livingAnswer.state))) {
    throw new Error('The Living Answer state is invalid.')
  }

  if (!isRecord(progress.preferences)) {
    throw new Error('User preferences are missing.')
  }
  if (typeof progress.preferences.reducedMotion !== 'boolean') {
    throw new Error('Reduced-motion preference is invalid.')
  }

  const pending = progress.pendingManifestation
  if (pending !== undefined) {
    validatePending(pending)
  }
}

function validatePending(pending: unknown): void {
  if (!isRecord(pending)) {
    throw new Error('Pending manifestation must be an object.')
  }
  if (
    typeof pending.powerId !== 'string' ||
    !powers.some((power) => power.id === pending.powerId)
  ) {
    throw new Error('Pending manifestation references an unknown power.')
  }
  if (!powerStates.has(pending.previousState as PowerState)) {
    throw new Error('Pending manifestation previous state is invalid.')
  }
  if (pending.nextState !== 'first_manifestation' && pending.nextState !== 'fully_manifested') {
    throw new Error('Pending manifestation next state is invalid.')
  }
}

function validateSelectionCount(powerName: string, state: PowerState, count: number): void {
  if (!Number.isInteger(count) || count < 0 || count > 2) {
    throw new Error(`Manifestation count for ${powerName} must be 0, 1, or 2.`)
  }
  if (state === 'unmanifested' && count !== 0) {
    throw new Error(`${powerName} cannot be unmanifested with a nonzero count.`)
  }
  if (state === 'first_manifestation' && count !== 1) {
    throw new Error(`${powerName} must have one manifestation in First Manifestation state.`)
  }
  if (state === 'fully_manifested' && count !== 2) {
    throw new Error(`${powerName} must have two manifestations in Fully Manifested state.`)
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}
