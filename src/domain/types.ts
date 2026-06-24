export type PowerState = 'unmanifested' | 'first_manifestation' | 'fully_manifested'

export type LivingAnswerState = 'locked' | 'available' | 'revealed'

export type TierId = 1 | 2 | 3 | 4 | 'convergence'

export type TreePoint = {
  x: number
  y: number
}

export type PowerDefinition = {
  id: string
  number: number
  name: string
  tier: TierId
  category: string
  shortDescription: string
  fullDescription: string
  dmExample?: string
  firstRollBacklash?: string
  weaknesses?: string
  hardCounters?: string
  convergenceSynergies?: string
  specialRules?: string
  selectable: boolean
  milestoneControlled: boolean
  requiredForLivingAnswer: boolean
  iconKey: IconKey
  visualPosition: TreePoint
  connectionTargets: string[]
}

export type IconKey =
  | 'gaze'
  | 'flight'
  | 'stormlight'
  | 'denial'
  | 'anchor'
  | 'impossible'
  | 'kinetic'
  | 'worldbreaker'
  | 'muscle'
  | 'predator'
  | 'breakline'
  | 'crown'
  | 'stance'
  | 'gaia'
  | 'law'
  | 'calamity'
  | 'momentum'
  | 'solar'
  | 'mandate'
  | 'convergence'

export type LivingAnswerDefinition = {
  id: 'living-answer'
  name: 'The Living Answer'
  shortDescription: string
  fullDescription: string
  unlockRequirement: string
  dmExample?: string
  weaknesses?: string
  visualPosition: TreePoint
}

export type PowerProgress = {
  powerId: string
  state: PowerState
  selectionCount: number
  firstManifestedAt?: string
  fullyManifestedAt?: string
}

export type ManifestationKind = 'First Manifestation' | 'Full Manifestation'

export type ManifestationHistoryEntry = {
  id: string
  sequence: number
  powerId: string
  powerName: string
  kind: ManifestationKind
  manifestedAt: string
}

export type PendingManifestation = {
  id: string
  powerId: string
  previousState: PowerState
  nextState: Exclude<PowerState, 'unmanifested'>
  kind: ManifestationKind
  selectedAt: string
  sequence: number
}

export type CooldownState = {
  blockedPowerId?: string
}

export type UserPreferences = {
  reducedMotion: boolean
}

export type LivingAnswerProgress = {
  state: LivingAnswerState
  revealedAt?: string
}

export type AppProgress = {
  powers: Record<string, PowerProgress>
  history: ManifestationHistoryEntry[]
  cooldown: CooldownState
  pendingManifestation?: PendingManifestation
  livingAnswer: LivingAnswerProgress
  preferences: UserPreferences
}

export type SavePayload = {
  schemaVersion: 1
  appVersion: string
  savedAt: string
  canonicalDataVersion: string
  canonicalDataHash: string
  progress: AppProgress
}

export type EligibleCandidate = {
  power: PowerDefinition
  progress: PowerProgress
  reason: string
}

export type IneligibleReason = {
  powerId: string
  reason: string
}

export type ConvergenceStatus = {
  powerState: PowerState
  synchronizedFullyManifested: number
  synchronizationTotal: number
  synchronizationRatio: number
  label: string
}

export type LivingAnswerStatus = {
  state: LivingAnswerState
  mechanicallyAvailable: boolean
  requiredPowersComplete: number
  requiredPowersTotal: number
  requirementText: string
}
