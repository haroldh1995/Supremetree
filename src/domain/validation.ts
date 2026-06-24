import { convergenceDefinition, livingAnswerDefinition, powerDefinitions } from '../data/powers'
import type { PowerDefinition, PowerProgress } from './types'

export interface ValidationResult {
  valid: boolean
  errors: string[]
  warnings: string[]
}

export function validatePowerDefinitions(
  definitions: PowerDefinition[] = powerDefinitions,
): ValidationResult {
  const errors: string[] = []
  const warnings: string[] = []
  const ids = new Set<string>()
  const numbers = new Set<number>()

  for (const power of definitions) {
    if (ids.has(power.id)) errors.push(`Duplicate power id: ${power.id}`)
    ids.add(power.id)
    if (numbers.has(power.displayNumber))
      errors.push(`Duplicate display number: ${power.displayNumber}`)
    numbers.add(power.displayNumber)
    if (power.tier < 1) errors.push(`${power.name} has an invalid tier.`)
    if (power.isRandomlySelectable && power.isMilestoneControlled) {
      errors.push(`${power.name} cannot be both rollable and milestone controlled.`)
    }
    for (const relatedId of power.convergenceSynergies) {
      if (!definitions.some((candidate) => candidate.id === relatedId)) {
        errors.push(`${power.name} references missing related power ${relatedId}.`)
      }
    }
  }

  if (!livingAnswerDefinition || livingAnswerDefinition.id !== 'the-living-answer') {
    errors.push('Exactly one recognized Living Answer final unlock is required.')
  }
  if (!convergenceDefinition) {
    errors.push('Convergence Engine definition is required.')
  }
  if (convergenceDefinition?.isRandomlySelectable) {
    errors.push('Convergence Engine must not be a normal random draw.')
  }
  if (definitions.length !== 20) {
    warnings.push(
      `DOCX-derived tree has ${definitions.length} powers; expected current structure is 20.`,
    )
  }

  return { valid: errors.length === 0, errors, warnings }
}

export function validateProgressIntegrity(input: {
  definitions?: PowerDefinition[]
  progress: PowerProgress[]
  allowLegacyFullyRealized?: boolean
}): ValidationResult {
  const definitions = input.definitions ?? powerDefinitions
  const errors: string[] = []
  const definitionIds = new Set(definitions.map((power) => power.id))
  const progressIds = new Set<string>()
  for (const record of input.progress) {
    if (!definitionIds.has(record.powerId))
      errors.push(`Progress references unknown power ${record.powerId}.`)
    if (progressIds.has(record.powerId))
      errors.push(`Duplicate progress record for ${record.powerId}.`)
    progressIds.add(record.powerId)
    if (
      record.state === 'fully-realized' &&
      record.advancedSessionIds.length < 2 &&
      !input.allowLegacyFullyRealized
    ) {
      errors.push(`${record.powerId} is fully realized without required prior advancement history.`)
    }
  }
  for (const definition of definitions) {
    if (!progressIds.has(definition.id))
      errors.push(`Missing progress record for ${definition.id}.`)
  }
  return { valid: errors.length === 0, errors, warnings: [] }
}
