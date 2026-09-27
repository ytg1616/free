import { useId } from 'react'
import { TIERS } from '../config'
import { invPhi, phi } from '../engine/normal'
import { topLabel } from '../format'
import { useTween } from '../hooks/useTween'

interface Props {
  /** 표시할 종합 백분위 */
  p: number
  color: string
  /** 대한민국 기준 위치 (다른 나라를 볼 때만) */
  baseline: { p: number; label: string } | null
}

const Z_MIN = -3.2
const Z_MAX = 3.2
const W = 360
const PAD_X = 6
const TOP = 50
const BASE = 172
const BAND_Y = BASE + 6
const BAND_H = 18
const H = BAND_Y + BAND_H + 2
const PEAK = phi(0)

const xOf = (z: number) => PAD_X + ((z - Z_MIN) / (Z_MAX - Z_MIN)) * (W - 2 * PAD_X)
const yOf = (z: number) => BASE - (phi(z) / PEAK) * (BASE - TOP)
const clampZ = (z: number) => Math.min(Z_MAX, Math.max(Z_MIN, z))
const f1 = (n: number) => n.toFixed(1)

function curvePoints(to: number): string {
  const pts: string[] = []
  for (let z = Z_MIN; z < to; z += 0.04) pts.push(`${f1(xOf(z))},${f1(yOf(z))}`)
  pts.push(`${f1(xOf(to))},${f1(yOf(to))}`)
  return pts.join(' L')
}

const CURVE = `M${curvePoints(Z_MAX)}`
const AREA = `M${f1(xOf(Z_MIN))},${BASE} L${curvePoints(Z_MAX)} L${f1(xOf(Z_MAX))},${BASE} Z`

/** 대략적인 글자 폭 (한글·이모지는 1em, 나머지는 0.6em) */
function textWidth(text: string, size: number): number {
  let w = 0
  for (const ch of text) w += /[ㄱ-힝]|\p{Extended_Pictographic}|[\u{1F1E6}-\u{1F1FF}]/u.test(ch) ? size : size * 0.6
  return w
}

const BANDS = TIERS.map((t, i) => {
  const from = i === 0 ? Z_MIN : clampZ(invPhi(TIERS[i - 1].max))
  const to = Number.isFinite(t.max) ? clampZ(invPhi(t.max)) : Z_MAX
  return { ...t, x0: xOf(from), x1: xOf(to) }
})

export default function BellCurve({ p, color, baseline }: Props) {
  const gradId = useId()
  const target = clampZ(invPhi(p))
  const z = useTween(target)
  const zBase = useTween(baseline ? clampZ(invPhi(baseline.p)) : target)

  const meX = xOf(z)
  const meY = yOf(z)
  const fill = `M${f1(xOf(Z_MIN))},${BASE} L${curvePoints(z)} L${f1(meX)},${BASE} Z`

  const label = `나 · ${topLabel(p)}`
  const labelSize = 13
  const pillW = textWidth(label, labelSize) + 20
  const pillH = 26
  const pillX = Math.min(W - PAD_X - pillW / 2, Math.max(PAD_X + pillW / 2, meX))
  const pillY = Math.max(4, meY - pillH - 14)

  const currentBand = (BANDS.find((b) => meX < b.x1) ?? BANDS[BANDS.length - 1]).key

  let baseMarker = null
  if (baseline) {
    const bx = xOf(zBase)
    const by = yOf(zBase)
    const size = 11
    const tw = textWidth(baseline.label, size)
    // 내 마커 반대쪽에 라벨을 두되, 자리가 없으면 반대편으로
    let side: 'left' | 'right' = zBase <= z ? 'left' : 'right'
    if (side === 'left' && bx - 6 - tw < PAD_X) side = 'right'
    if (side === 'right' && bx + 6 + tw > W - PAD_X) side = 'left'
    baseMarker = (
      <g className="baseline-marker">
        <line x1={bx} x2={bx} y1={BASE} y2={by + 5} stroke="var(--text)" strokeWidth="1.5" strokeDasharray="4 3" opacity="0.8" />
        <circle cx={bx} cy={by} r="4.5" fill="var(--bg)" stroke="var(--text)" strokeWidth="1.5" />
        <text
          x={side === 'left' ? bx - 6 : bx + 6}
          y={BASE - 9}
          fontSize={size}
          textAnchor={side === 'left' ? 'end' : 'start'}
          fill="var(--text)"
          className="svg-label"
        >
          {baseline.label}
        </text>
      </g>
    )
  }

  return (
    <svg
      className="bell-curve"
      viewBox={`0 0 ${W} ${H}`}
      role="img"
      aria-label={`분포 곡선 위 내 위치: ${topLabel(p)}${baseline ? `, ${baseline.label} ${topLabel(baseline.p)}` : ''}`}
    >
      <defs>
        <linearGradient id={gradId} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor={color} stopOpacity="0.75" />
          <stop offset="1" stopColor={color} stopOpacity="0.15" />
        </linearGradient>
      </defs>

      <path d={AREA} fill="var(--curve-bg)" />
      <path d={fill} fill={`url(#${gradId})`} />
      <path d={CURVE} fill="none" stroke="var(--curve-line)" strokeWidth="2" />
      <line x1={PAD_X} x2={W - PAD_X} y1={BASE} y2={BASE} stroke="var(--curve-line)" strokeWidth="1" />

      {BANDS.map((b) => {
        const active = b.key === currentBand
        const w = b.x1 - b.x0
        const size = 9.5
        const natural = textWidth(b.name, size)
        return (
          <g key={b.key}>
            <rect
              x={b.x0 + 0.5}
              y={BAND_Y}
              width={Math.max(0, w - 1)}
              height={BAND_H}
              rx="3"
              fill={b.color}
              opacity={active ? 1 : 0.22}
            />
            <text
              x={(b.x0 + b.x1) / 2}
              y={BAND_Y + BAND_H / 2 + 3.4}
              fontSize={size}
              textAnchor="middle"
              fill={active ? '#15132a' : b.color}
              fontWeight={active ? 700 : 500}
              className="svg-label"
              {...(natural > w - 4 ? { textLength: w - 4, lengthAdjust: 'spacingAndGlyphs' } : {})}
            >
              {b.name}
            </text>
          </g>
        )
      })}

      {baseMarker}

      <g className="me-marker">
        <line x1={meX} x2={meX} y1={BASE} y2={meY} stroke={color} strokeWidth="2" />
        <line x1={meX} x2={meX} y1={meY} y2={pillY + pillH} stroke={color} strokeWidth="1.5" opacity="0.7" />
        <circle cx={meX} cy={meY} r="6" fill={color} stroke="var(--bg)" strokeWidth="2.5" />
        <rect x={pillX - pillW / 2} y={pillY} width={pillW} height={pillH} rx={pillH / 2} fill={color} />
        <text
          x={pillX}
          y={pillY + pillH / 2 + labelSize * 0.36}
          fontSize={labelSize}
          fontWeight="700"
          textAnchor="middle"
          fill="#15132a"
          className="svg-label"
        >
          {label}
        </text>
      </g>
    </svg>
  )
}
