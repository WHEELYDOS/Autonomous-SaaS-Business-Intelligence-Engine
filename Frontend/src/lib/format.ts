export function fmtMoney(value: number): string {
  const abs = Math.abs(value)
  const sign = value < 0 ? '−' : ''
  if (abs >= 1_000_000) return `${sign}$${(abs / 1_000_000).toFixed(2)}M`
  if (abs >= 1_000) return `${sign}$${(abs / 1_000).toFixed(1)}k`
  return `${sign}$${abs.toLocaleString('en-US')}`
}

export function fmtInt(value: number): string {
  return value.toLocaleString('en-US')
}

export function fmtPct(value: number, digits = 1): string {
  return `${value.toFixed(digits)}%`
}

/** Signed percentage-point delta, e.g. "+6.8 pts". */
export function fmtPts(value: number, digits = 1): string {
  const sign = value > 0 ? '+' : value < 0 ? '−' : ''
  return `${sign}${Math.abs(value).toFixed(digits)} pts`
}

export function fmtSigned(value: number, digits = 1, suffix = ''): string {
  const sign = value > 0 ? '+' : value < 0 ? '−' : ''
  return `${sign}${Math.abs(value).toFixed(digits)}${suffix}`
}

/** Confidence range, e.g. "4.1 to 9.5". */
export function fmtRange(lo: number, hi: number, digits = 1): string {
  const f = (n: number) => (n < 0 ? `−${Math.abs(n).toFixed(digits)}` : n.toFixed(digits))
  return `${f(lo)} to ${f(hi)}`
}
