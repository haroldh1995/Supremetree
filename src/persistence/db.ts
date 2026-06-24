import Dexie, { type Table } from 'dexie'
import type {
  AuditEvent,
  BackupMetadata,
  Campaign,
  CampaignSettings,
  CatchUpCredit,
  DrawResult,
  LivingAnswerRecord,
  MilestoneRequirement,
  PowerProgress,
  SessionRecord,
  UiPreferences,
} from '../domain/types'

export class DumareDatabase extends Dexie {
  campaigns!: Table<Campaign, string>
  settings!: Table<CampaignSettings, string>
  powerProgress!: Table<PowerProgress, string>
  sessions!: Table<SessionRecord, string>
  drawHistory!: Table<DrawResult, string>
  auditEvents!: Table<AuditEvent, string>
  catchUpCredits!: Table<CatchUpCredit, string>
  narrativeRequirements!: Table<MilestoneRequirement, string>
  livingAnswer!: Table<LivingAnswerRecord, string>
  uiPreferences!: Table<UiPreferences, string>
  backupMetadata!: Table<BackupMetadata, string>

  constructor() {
    super('dumare-power-realization-tracker')
    this.version(1).stores({
      campaigns: 'id, createdAt, updatedAt',
      settings: 'campaignId, startDate, targetDate',
      powerProgress: 'powerId, state, narrativeLocked, temporaryExcluded',
      sessions: 'id, sessionNumber, date, attended, updatedAt',
      drawHistory: 'id, sessionId, selectedPowerId, timestamp, status',
      auditEvents: 'id, timestamp, type, relatedSessionId, relatedPowerId, source',
      catchUpCredits: 'id, status, campaignMonth, dateCreated',
      narrativeRequirements: 'id, source, complete',
      livingAnswer: 'id, status',
      uiPreferences: 'id',
      backupMetadata: 'id, createdAt',
    })
  }
}

export const db = new DumareDatabase()

export const allTables = [
  db.campaigns,
  db.settings,
  db.powerProgress,
  db.sessions,
  db.drawHistory,
  db.auditEvents,
  db.catchUpCredits,
  db.narrativeRequirements,
  db.livingAnswer,
  db.uiPreferences,
  db.backupMetadata,
] as const
