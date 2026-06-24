import type { EligibleCandidate } from './types'

export type RandomIntProvider = (exclusiveMax: number) => number

const UINT32_RANGE = 0x100000000

export function secureRandomInt(exclusiveMax: number): number {
  if (!Number.isInteger(exclusiveMax) || exclusiveMax <= 0) {
    throw new Error('Random selection requires a positive integer candidate count')
  }

  const cryptoObject = globalThis.crypto
  if (cryptoObject?.getRandomValues) {
    const limit = Math.floor(UINT32_RANGE / exclusiveMax) * exclusiveMax
    const buffer = new Uint32Array(1)
    let value = UINT32_RANGE
    while (value >= limit) {
      cryptoObject.getRandomValues(buffer)
      const next = buffer[0]
      value = typeof next === 'number' ? next : UINT32_RANGE
    }
    return value % exclusiveMax
  }

  return Math.floor(Math.random() * exclusiveMax)
}

export function selectRandomCandidate(
  candidates: EligibleCandidate[],
  randomInt: RandomIntProvider = secureRandomInt,
): EligibleCandidate {
  if (candidates.length === 0) {
    throw new Error('No eligible powers are available for manifestation')
  }
  const index = randomInt(candidates.length)
  const candidate = candidates[index]
  if (!candidate) {
    throw new Error(`Random provider returned an out-of-range index: ${index}`)
  }
  return candidate
}

export function createDeterministicRandom(sequence: number[]): RandomIntProvider {
  let index = 0
  return (exclusiveMax: number) => {
    const value = sequence[index] ?? 0
    index += 1
    return Math.abs(value) % exclusiveMax
  }
}
