import type { GuestData } from '@/lib/types'

/**
 * Collapse guests that are the SAME person entered twice. The document number is
 * NOT a reliable key: two OCR passes of the same passport can read it a digit
 * differently (the real bug that produced duplicate travelers). The stable
 * identity is **name + date of birth**, so that's the dedup key.
 */
export function guestKey(g: GuestData): string {
  const name = [g.ap1, g.ap2, g.nom]
    .map((s) => (s ?? '').trim().toUpperCase())
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim()
  const dob = (g.naix ?? '').trim()
  return `${name}|${dob}`
}

/** How many identity/document fields a guest has filled — used to keep the richer copy. */
function completeness(g: GuestData): number {
  const fields: (keyof GuestData)[] = [
    'nom', 'ap1', 'ap2', 'sexe', 'naix', 'nac', 'tipo', 'numdoc', 'expedicion',
    'soporte_dni', 'entrada', 'salida', 'tel', 'email', 'direccion', 'cp',
    'provincia', 'municipio', 'localidad', 'pais_residencia',
  ]
  return fields.reduce((n, k) => (g[k] && String(g[k]).trim() ? n + 1 : n), 0)
}

/** True if two or more guests share a name+DOB key (i.e. a duplicate exists). */
export function hasDuplicateGuests(guests: GuestData[]): boolean {
  const seen = new Set<string>()
  for (const g of guests) {
    const k = guestKey(g)
    if (k === '|') continue
    if (seen.has(k)) return true
    seen.add(k)
  }
  return false
}

/**
 * Deduplicate a guest array by name+DOB, keeping the most complete copy of each
 * person and preserving first-seen order. Guests with no name AND no DOB are kept
 * as-is. Pure — never mutates the input.
 */
export function dedupeGuests(guests: GuestData[]): GuestData[] {
  const byKey = new Map<string, number>()
  const result: GuestData[] = []
  for (const g of guests) {
    const k = guestKey(g)
    if (k === '|') { result.push(g); continue }
    const existingIdx = byKey.get(k)
    if (existingIdx === undefined) {
      byKey.set(k, result.length)
      result.push(g)
    } else if (completeness(g) > completeness(result[existingIdx])) {
      result[existingIdx] = g
    }
  }
  return result
}
