// DRAW_START_AT: ISO datetime string (e.g. "2026-06-14T19:00:00+07:00").
// Leave unset to keep the draw open at all times.
export function getDrawStartAt(): Date | null {
  const raw = process.env.DRAW_START_AT
  if (!raw) return null
  const date = new Date(raw)
  return isNaN(date.getTime()) ? null : date
}

export function isDrawOpen(now: Date = new Date()): boolean {
  const start = getDrawStartAt()
  if (!start) return true
  return now.getTime() >= start.getTime()
}
