let ctx: AudioContext | null = null
let tickId: ReturnType<typeof setTimeout> | null = null

function getCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null
  try {
    if (!ctx) {
      ctx = new (window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
    }
    if (ctx.state === 'suspended') ctx.resume()
    return ctx
  } catch {
    return null
  }
}

function beep(freq: number, duration: number, volume: number, type: OscillatorType) {
  const c = getCtx()
  if (!c) return
  try {
    const osc = c.createOscillator()
    const gain = c.createGain()
    osc.connect(gain)
    gain.connect(c.destination)
    osc.type = type
    osc.frequency.setValueAtTime(freq, c.currentTime)
    gain.gain.setValueAtTime(volume, c.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + duration)
    osc.start(c.currentTime)
    osc.stop(c.currentTime + duration)
  } catch {
    // ignore if audio unavailable
  }
}

// tick sound — pitch drops gradually as wheel slows
export function startSpinTicks(totalMs: number) {
  stopSpinTicks()
  const startTime = Date.now()

  function next() {
    const progress = Math.min((Date.now() - startTime) / totalMs, 1)
    const freq = 1100 - 420 * progress
    beep(freq, 0.05, 0.13, 'square')
    if (progress < 0.97) {
      // interval goes from ~55ms (fast) to ~440ms (slow)
      const interval = 55 + 385 * Math.pow(progress, 1.7)
      tickId = setTimeout(next, interval)
    }
  }

  next()
}

export function stopSpinTicks() {
  if (tickId) {
    clearTimeout(tickId)
    tickId = null
  }
}

// ascending fanfare C–E–G–C–E (major arpeggio)
export function playWin() {
  const notes = [523, 659, 784, 1047, 1319]
  notes.forEach((freq, i) => {
    setTimeout(() => beep(freq, 0.45, 0.22, 'triangle'), i * 110)
  })
}
