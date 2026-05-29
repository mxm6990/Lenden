/** Parse BDT amount input — strips commas, currency symbols, and whitespace. */
export function parseAmountInput(raw: string): number | null {
  const cleaned = raw.replace(/[,\s৳BDTbdt]/gi, '').trim()
  if (!cleaned) return null
  const value = Number(cleaned)
  if (!Number.isFinite(value)) return null
  return value
}

export function formatAmountInputDisplay(value: number): string {
  if (!Number.isFinite(value) || value <= 0) return ''
  return String(Math.round(value * 100) / 100)
}

export function parseSharesInput(raw: string): number | null {
  const cleaned = raw.replace(/[,\s]/g, '').trim()
  if (!cleaned) return null
  const value = Number(cleaned)
  if (!Number.isFinite(value)) return null
  return value
}
