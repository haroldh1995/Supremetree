import { createSavePayload, validateSavePayload } from './save'
import type { AppProgress } from './types'

export const AUTOSAVE_KEY = 'dumare.supreme-power-tree.autosave.v1'

export function saveAutosave(progress: AppProgress, storage: Storage = localStorage): void {
  storage.setItem(AUTOSAVE_KEY, JSON.stringify(createSavePayload(progress)))
}

export function loadAutosave(storage: Storage = localStorage): AppProgress | undefined {
  const raw = storage.getItem(AUTOSAVE_KEY)
  if (!raw) {
    return undefined
  }
  try {
    return validateSavePayload(JSON.parse(raw)).progress
  } catch {
    storage.removeItem(AUTOSAVE_KEY)
    return undefined
  }
}

export function clearAutosave(storage: Storage = localStorage): void {
  storage.removeItem(AUTOSAVE_KEY)
}
