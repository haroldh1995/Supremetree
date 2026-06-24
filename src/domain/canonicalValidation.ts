import { livingAnswer, powers } from '../data/powers'
import type { PowerDefinition } from './types'

export function validateCanonicalData(definitions: PowerDefinition[] = powers): string[] {
  const errors: string[] = []
  const ids = new Set<string>()
  const numbers = new Set<number>()

  for (const power of definitions) {
    if (ids.has(power.id)) {
      errors.push(`Duplicate power id: ${power.id}`)
    }
    ids.add(power.id)

    if (numbers.has(power.number)) {
      errors.push(`Duplicate display number: ${power.number}`)
    }
    numbers.add(power.number)

    if (power.number < 1 || power.number > 20) {
      errors.push(`${power.name} has invalid display number ${power.number}`)
    }

    if (power.selectable && power.milestoneControlled) {
      errors.push(`${power.name} cannot be both randomly selectable and milestone controlled`)
    }

    for (const target of power.connectionTargets) {
      if (target !== livingAnswer.id && !definitions.some((candidate) => candidate.id === target)) {
        errors.push(`${power.name} references missing connection target ${target}`)
      }
    }
  }

  if (definitions.length !== 20) {
    errors.push(`Expected 20 D20 powers from the DOCX, found ${definitions.length}`)
  }

  if (livingAnswer.id !== 'living-answer') {
    errors.push('Exactly one recognized Living Answer definition is required')
  }

  const convergence = definitions.find((power) => power.id === 'convergence-engine')
  if (!convergence) {
    errors.push('Convergence Engine definition is missing')
  } else if (convergence.number !== 20) {
    errors.push('Convergence Engine must retain display number 20 from the DOCX')
  }

  return errors
}

export function assertValidCanonicalData(): void {
  const errors = validateCanonicalData()
  if (errors.length > 0) {
    throw new Error(`Invalid canonical Dumare data:\n${errors.join('\n')}`)
  }
}
