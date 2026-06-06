// Canvas confetti — burst() and continuous rain
const COLORS = ['#38bdf8', '#fbbf24', '#f0f9ff', '#22d3ee', '#facc15', '#a78bfa']

function rand(min: number, max: number) {
  return Math.random() * (max - min) + min
}

function makeCanvas() {
  const c = document.createElement('canvas')
  c.style.cssText =
    'position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:9998;'
  document.body.appendChild(c)
  const ctx = c.getContext('2d')!
  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    c.width = window.innerWidth * dpr
    c.height = window.innerHeight * dpr
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  }
  resize()
  window.addEventListener('resize', resize)
  return { c, ctx }
}

interface Particle {
  x: number; y: number; vx: number; vy: number
  size: number; rot: number; vrot: number
  color: string; life: number; decay: number
  shape: 'rect' | 'circle'
}

function spawn(
  x: number, y: number, count: number, speedScale: number, colors: string[]
): Particle[] {
  const parts: Particle[] = []
  for (let i = 0; i < count; i++) {
    const angle = rand(0, Math.PI * 2)
    const speed = rand(4, 13) * speedScale
    parts.push({
      x, y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - rand(2, 7),
      size: rand(5, 11),
      rot: rand(0, Math.PI * 2),
      vrot: rand(-0.3, 0.3),
      color: colors[Math.floor(Math.random() * colors.length)],
      life: 1,
      decay: rand(0.006, 0.013),
      shape: Math.random() > 0.5 ? 'rect' : 'circle',
    })
  }
  return parts
}

interface BurstOpts {
  intensity?: number
  colors?: string[]
  origins?: { x: number; y: number }[]
}

let burstCanvas: { c: HTMLCanvasElement; ctx: CanvasRenderingContext2D } | null = null

export function burst(opts: BurstOpts = {}) {
  const intensity = opts.intensity ?? 1
  if (intensity <= 0) return
  if (!burstCanvas) burstCanvas = makeCanvas()
  const { c, ctx } = burstCanvas
  const colors = opts.colors || COLORS
  let parts: Particle[] = []
  const origins = opts.origins || [{ x: window.innerWidth * 0.5, y: window.innerHeight * 0.42 }]
  origins.forEach(o => parts.push(...spawn(o.x, o.y, Math.round(70 * intensity), 1, colors)))

  const gravity = 0.28
  function frame() {
    ctx.clearRect(0, 0, c.width, c.height)
    let alive = false
    for (const p of parts) {
      if (p.life <= 0) continue
      alive = true
      p.vy += gravity
      p.vx *= 0.99
      p.x += p.vx
      p.y += p.vy
      p.rot += p.vrot
      p.life -= p.decay
      ctx.save()
      ctx.globalAlpha = Math.max(0, p.life)
      ctx.translate(p.x, p.y)
      ctx.rotate(p.rot)
      ctx.fillStyle = p.color
      if (p.shape === 'rect') ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6)
      else { ctx.beginPath(); ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2); ctx.fill() }
      ctx.restore()
    }
    if (alive) requestAnimationFrame(frame)
    else ctx.clearRect(0, 0, c.width, c.height)
  }
  requestAnimationFrame(frame)
}

interface RainParticle {
  x: number; y: number; vx: number; vy: number
  size: number; rot: number; vrot: number; color: string
}

interface RainState {
  c: HTMLCanvasElement
  ctx: CanvasRenderingContext2D
  stop: () => void
}

let rainState: RainState | null = null

export function startRain(opts: { intensity?: number; colors?: string[] } = {}) {
  const intensity = opts.intensity ?? 1
  if (intensity <= 0) return
  stopRain()
  const { c, ctx } = makeCanvas()
  const colors = opts.colors || COLORS
  const parts: RainParticle[] = []
  const max = Math.round(60 * intensity)
  let running = true

  function add() {
    parts.push({
      x: rand(0, window.innerWidth),
      y: -20,
      vx: rand(-0.6, 0.6),
      vy: rand(1.5, 3.5),
      size: rand(4, 9),
      rot: rand(0, 6),
      vrot: rand(-0.1, 0.1),
      color: colors[Math.floor(Math.random() * colors.length)],
    })
  }

  function frame() {
    if (!running) return
    ctx.clearRect(0, 0, c.width, c.height)
    if (parts.length < max && Math.random() > 0.4) add()
    for (let i = parts.length - 1; i >= 0; i--) {
      const p = parts[i]
      p.x += p.vx; p.y += p.vy; p.rot += p.vrot
      ctx.save()
      ctx.globalAlpha = 0.85
      ctx.translate(p.x, p.y)
      ctx.rotate(p.rot)
      ctx.fillStyle = p.color
      ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6)
      ctx.restore()
      if (p.y > window.innerHeight + 20) parts.splice(i, 1)
    }
    requestAnimationFrame(frame)
  }

  rainState = { c, ctx, stop: () => { running = false; c.remove() } }
  requestAnimationFrame(frame)
}

export function stopRain() {
  if (rainState) { rainState.stop(); rainState = null }
}
