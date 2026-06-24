export type PowerState = 'locked' | 'manifested' | 'fully-realized'

export type AuditSource =
  | 'random'
  | 'manual'
  | 'catch-up'
  | 'milestone'
  | 'import'
  | 'correction'
  | 'system'

export type AuditEventType =
  | 'campaign-created'
  | 'campaign-settings-changed'
  | 'session-created'
  | 'session-edited'
  | 'session-missed'
  | 'session-deleted'
  | 'random-draw-performed'
  | 'draw-rerolled'
  | 'draw-cancelled'
  | 'advancement-committed'
  | 'manual-advancement'
  | 'advancement-reversed'
  | 'power-locked'
  | 'power-unlocked'
  | 'power-edited'
  | 'catch-up-credit-created'
  | 'catch-up-credit-used'
  | 'catch-up-credit-updated'
  | 'milestone-completed'
  | 'convergence-engine-advanced'
  | 'living-answer-available'
  | 'living-answer-revealed'
  | 'living-answer-fully-active'
  | 'import-performed'
  | 'restore-performed'
  | 'campaign-reset'
  | 'undo-performed'

export type DrawKind = 'normal' | 'catch-up' | 'bonus' | 'forced'

export type LivingAnswerStatus =
  | 'sealed'
  | 'requirements-in-progress'
  | 'mechanically-available'
  | 'narratively-revealed'
  | 'fully-active'

export type CatchUpCreditStatus =
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'deferred'
  | 'converted-to-milestone'
  | 'used'

export interface PowerDefinition {
  id: string
  displayNumber: number
  name: string
  shortSummary: string
  fullDescription: string
  dmExample?: string
  tier: number
  tierLabel: string
  relativeStrengthOrder: number
  category: string
  firstRollBacklash?: string
  weaknesses: string[]
  hardCounters: string[]
  convergenceSynergies: string[]
  specialAcquisitionRules: string[]
  isRandomlySelectable: boolean
  isMilestoneControlled: boolean
  isRequiredForLivingAnswer: boolean
  notes: string[]
}

export interface FinalUnlockDefinition {
  id: 'the-living-answer'
  name: 'The Living Answer'
  unlockRequirement: string
  description: string
  dmExample?: string
  weaknesses: string[]
  hardCounters: string[]
  notes: string[]
}

export interface CampaignSettings {
  campaignId: string
  campaignName: string
  startDate: string
  targetDate: string
  defaultDurationMonths: number
  expectedSessionsPerMonth: number
  weeklySessionDay: number
  ordinaryCompletionMonth: number
  convergenceCompletionMonth: number
  livingAnswerRevealMonth: number
  catchUpRequiresApproval: boolean
  automaticCatchUpCredits: boolean
  cooldownAdvancements: number
  sameSessionDuplicateRequiresOverride: boolean
  tierGatingEnabled: boolean
  animationLevel: 'full' | 'reduced' | 'none'
  soundEffects: boolean
  appearance: 'dark' | 'light' | 'system'
  density: 'comfortable' | 'compact'
  dmPin?: string
}

export interface Campaign {
  id: string
  name: string
  createdAt: string
  updatedAt: string
  canonicalPowerDataVersion: string
  guidedTourDismissed: boolean
}

export interface PowerProgress {
  powerId: string
  state: PowerState
  manifestationCount: number
  appearanceCount: number
  lastAdvancedAt?: string
  advancedSessionIds: string[]
  narrativeLocked: boolean
  temporaryExcluded: boolean
  randomSelectionAllowed: boolean
  tierOverride?: number
  relativeWeightOverride?: number
  lockReason?: string
  dmNotes?: string
  backlashStatus: 'not-triggered' | 'triggered' | 'resolved' | 'modified' | 'skipped' | 'custom'
  backlashOutcome?: string
}

export interface AdvancementNarrative {
  triggeringEvent?: string
  manifestationAppearance?: string
  backlashOutcome?: string
  consequences?: string
  witnesses?: string
  notes?: string
}

export interface AdvancementRecord {
  id: string
  powerId: string
  previousState: PowerState
  newState: PowerState
  sessionId: string
  kind: DrawKind
  source: AuditSource
  timestamp: string
  reason: string
  narrative: AdvancementNarrative
  firstRollBacklash?: string
}

export interface SessionRecord {
  id: string
  sessionNumber: number
  date: string
  attended: boolean
  title?: string
  summary?: string
  majorSession: boolean
  bossEncounter: boolean
  divineMilestone: boolean
  normalAdvancements: number
  bonusAdvancements: number
  catchUpAdvancements: number
  powerAdvancements: AdvancementRecord[]
  manualCorrections: string[]
  dmNotes?: string
  createdAt: string
  updatedAt: string
}

export interface DrawCandidate {
  power: PowerDefinition
  progress: PowerProgress
  eligible: boolean
  reasons: string[]
  ineligibleReasons: string[]
  weight: number
  lastAdvancedAt?: string
}

export interface DrawResult {
  id: string
  sessionId: string
  kind: DrawKind
  selectedPowerId: string
  candidateCount: number
  candidateSnapshot: Array<Pick<DrawCandidate, 'weight' | 'eligible'> & { powerId: string }>
  previousState: PowerState
  newState: PowerState
  eligibilityReason: string
  cooldownCreated: boolean
  scheduleProtectionActive: boolean
  timestamp: string
  status: 'previewed' | 'committed' | 'rerolled' | 'cancelled'
  rerollReason?: string
}

export interface CatchUpCredit {
  id: string
  dateCreated: string
  reason: string
  campaignMonth: number
  stagesOwed: number
  used: number
  remaining: number
  dmApprovalRequired: boolean
  status: CatchUpCreditStatus
  relatedMissedSessionIds: string[]
  notes?: string
}

export interface MilestoneRequirement {
  id: string
  label: string
  description: string
  complete: boolean
  completedAt?: string
  source: 'living-answer' | 'convergence' | 'custom'
  requiredPowerIds?: string[]
}

export interface LivingAnswerRecord {
  id: 'the-living-answer'
  status: LivingAnswerStatus
  mechanicallyAvailableAt?: string
  narrativeRevealConfirmedAt?: string
  fullyActiveAt?: string
  dmNotes?: string
  manaBatteryEmergencyOnly: true
  manaBatteryFullActivation: 'inactive' | 'emergency-available' | 'used'
}

export interface AuditEvent {
  id: string
  timestamp: string
  type: AuditEventType
  relatedSessionId?: string
  relatedPowerId?: string
  previousValue?: unknown
  newValue?: unknown
  reason: string
  source: AuditSource
  reversible: boolean
  undoneByEventId?: string
}

export interface UiPreferences {
  id: 'local'
  activePowerId?: string
  treeZoom: number
  treeX: number
  treeY: number
  guidedTourDismissed: boolean
}

export interface BackupMetadata {
  id: string
  createdAt: string
  reason: string
  filename: string
}

export interface BackupPayload {
  schemaVersion: number
  exportedAt: string
  appName: 'Dumare: Power Realization Tracker'
  canonicalPowerDataVersion: string
  campaigns: Campaign[]
  settings: CampaignSettings[]
  powerProgress: PowerProgress[]
  sessions: SessionRecord[]
  drawHistory: DrawResult[]
  auditEvents: AuditEvent[]
  catchUpCredits: CatchUpCredit[]
  narrativeRequirements: MilestoneRequirement[]
  livingAnswer: LivingAnswerRecord[]
  uiPreferences: UiPreferences[]
  backupMetadata: BackupMetadata[]
}

export interface AppData {
  campaign: Campaign | null
  settings: CampaignSettings | null
  powerProgress: PowerProgress[]
  sessions: SessionRecord[]
  drawHistory: DrawResult[]
  auditEvents: AuditEvent[]
  catchUpCredits: CatchUpCredit[]
  narrativeRequirements: MilestoneRequirement[]
  livingAnswer: LivingAnswerRecord | null
  uiPreferences: UiPreferences
  backupMetadata: BackupMetadata[]
}
