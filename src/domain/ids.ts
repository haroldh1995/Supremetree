export function makeId(prefix: string): string {
  const cryptoRef = globalThis.crypto
  if (cryptoRef && 'randomUUID' in cryptoRef) {
    return `${prefix}_${cryptoRef.randomUUID()}`
  }
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`
}

export function nowIso(): string {
  return new Date().toISOString()
}

export function todayIso(): string {
  return new Date().toISOString().slice(0, 10)
}
