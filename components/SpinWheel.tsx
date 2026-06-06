'use client'

interface Country {
  id: string | number
  name: string
  flag: string
}

interface Props {
  countries: Country[]
  rotation: number
  duration: number  // ms
  spinning: boolean
  accent?: string
  gold?: string
}

function polar(r: number, aDeg: number): [number, number] {
  const a = (aDeg - 90) * Math.PI / 180
  return [r * Math.cos(a), r * Math.sin(a)]
}

export function SpinWheel({
  countries,
  rotation,
  duration,
  spinning,
  accent = '#38bdf8',
  gold = '#fbbf24',
}: Props) {
  const R = 200
  const n = Math.max(countries.length, 1)
  const seg = 360 / n
  const flagR = R * 0.78
  const flagSize = Math.min(26, 360 / n + 6)

  const slices = countries.map((c, i) => {
    const start = i * seg
    const end = start + seg
    const [x1, y1] = polar(R, start)
    const [x2, y2] = polar(R, end)
    const large = seg > 180 ? 1 : 0
    const path = `M0 0 L ${x1.toFixed(2)} ${y1.toFixed(2)} A ${R} ${R} 0 ${large} 1 ${x2.toFixed(2)} ${y2.toFixed(2)} Z`
    const fill = i % 2 === 0 ? 'rgba(56,189,248,0.16)' : 'rgba(251,191,36,0.12)'
    const stroke = i % 2 === 0 ? accent : gold
    const mid = start + seg / 2
    const [fx, fy] = polar(flagR, mid)
    return { path, fill, stroke, fx, fy, mid, c, i }
  })

  return (
    <div className="wheel-wrap">
      <div className="wheel-pointer" aria-hidden="true">▼</div>
      <div className="wheel-glow" />
      <svg
        className="wheel"
        viewBox="-220 -220 440 440"
        style={{
          transform: `rotate(${rotation}deg)`,
          transition: spinning ? `transform ${duration}ms cubic-bezier(0.16, 0.84, 0.18, 1)` : 'none',
        }}
      >
        <circle r={R + 9} fill="none" stroke={gold} strokeWidth="5" opacity="0.85" />
        <circle r={R + 9} fill="none" stroke={accent} strokeWidth="5" opacity="0.3" />
        {slices.map((s) => (
          <g key={s.i}>
            <path d={s.path} fill={s.fill} stroke={s.stroke} strokeWidth="1.1" strokeOpacity="0.55" />
            <text
              x={s.fx}
              y={s.fy}
              className="wheel-flag"
              textAnchor="middle"
              dominantBaseline="central"
              transform={`rotate(${s.mid} ${s.fx} ${s.fy})`}
              style={{ fontSize: flagSize }}
            >
              {s.c.flag}
            </text>
          </g>
        ))}
        <circle r="42" className="wheel-hub-bg" />
        <circle r="42" fill="none" stroke={gold} strokeWidth="3" />
        <text className="wheel-hub" textAnchor="middle" dominantBaseline="central" style={{ fontSize: 40 }}>
          ⚽
        </text>
      </svg>
    </div>
  )
}
