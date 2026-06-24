import { z } from 'zod'
import { POWER_DATA_VERSION } from '../data/powers'
import type { AppData, BackupPayload } from './types'

export const BACKUP_SCHEMA_VERSION = 1

const backupSchema = z.object({
  schemaVersion: z.number(),
  exportedAt: z.string(),
  appName: z.literal('Dumare: Power Realization Tracker'),
  canonicalPowerDataVersion: z.string(),
  campaigns: z.array(z.record(z.string(), z.unknown())),
  settings: z.array(z.record(z.string(), z.unknown())),
  powerProgress: z.array(z.record(z.string(), z.unknown())),
  sessions: z.array(z.record(z.string(), z.unknown())),
  drawHistory: z.array(z.record(z.string(), z.unknown())),
  auditEvents: z.array(z.record(z.string(), z.unknown())),
  catchUpCredits: z.array(z.record(z.string(), z.unknown())),
  narrativeRequirements: z.array(z.record(z.string(), z.unknown())),
  livingAnswer: z.array(z.record(z.string(), z.unknown())),
  uiPreferences: z.array(z.record(z.string(), z.unknown())),
  backupMetadata: z.array(z.record(z.string(), z.unknown())),
})

export function createBackupPayload(data: AppData): BackupPayload {
  return {
    schemaVersion: BACKUP_SCHEMA_VERSION,
    exportedAt: new Date().toISOString(),
    appName: 'Dumare: Power Realization Tracker',
    canonicalPowerDataVersion: POWER_DATA_VERSION,
    campaigns: data.campaign ? [data.campaign] : [],
    settings: data.settings ? [data.settings] : [],
    powerProgress: data.powerProgress,
    sessions: data.sessions,
    drawHistory: data.drawHistory,
    auditEvents: data.auditEvents,
    catchUpCredits: data.catchUpCredits,
    narrativeRequirements: data.narrativeRequirements,
    livingAnswer: data.livingAnswer ? [data.livingAnswer] : [],
    uiPreferences: [data.uiPreferences],
    backupMetadata: data.backupMetadata,
  }
}

export function validateBackupPayload(raw: unknown): BackupPayload {
  const result = backupSchema.safeParse(raw)
  if (!result.success) {
    throw new Error(
      `Invalid backup file: ${result.error.issues.map((issue) => issue.message).join(', ')}`,
    )
  }
  if (result.data.schemaVersion > BACKUP_SCHEMA_VERSION) {
    throw new Error(`Unsupported backup version ${result.data.schemaVersion}.`)
  }
  return result.data as unknown as BackupPayload
}

export function migrateBackupPayload(payload: BackupPayload): BackupPayload {
  if (payload.schemaVersion === BACKUP_SCHEMA_VERSION) return payload
  return {
    ...payload,
    schemaVersion: BACKUP_SCHEMA_VERSION,
    canonicalPowerDataVersion: payload.canonicalPowerDataVersion || POWER_DATA_VERSION,
  }
}

export function timestampedBackupFilename(exportedAt = new Date()): string {
  return `dumare-power-tracker-${exportedAt.toISOString().replace(/[:.]/g, '-')}.json`
}
