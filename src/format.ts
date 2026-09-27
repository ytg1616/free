import { TIERS } from './config'
import type { CountryCode, TierKey } from './engine/types'

function trimZero(s: string): string {
  return s.endsWith('.0') ? s.slice(0, -2) : s
}

/** 백분위 p → "상위 N%"의 N 부분. 10 이상은 정수, 그 아래는 소수 한 자리(최소 0.1) */
export function topPercent(p: number): string {
  const v = (1 - p) * 100
  if (v >= 9.95) return `${Math.round(v)}%`
  return `${trimZero(Math.max(0.1, Math.round(v * 10) / 10).toFixed(1))}%`
}

export function topLabel(p: number): string {
  return `상위 ${topPercent(p)}`
}

/** 만원 단위 숫자 → "1억 2,000만원" */
export function formatManwon(manwon: number): string {
  if (manwon === 0) return '0원'
  const sign = manwon < 0 ? '-' : ''
  const abs = Math.abs(Math.trunc(manwon))
  const eok = Math.floor(abs / 10_000)
  const man = abs % 10_000
  const parts: string[] = []
  if (eok > 0) parts.push(`${eok.toLocaleString('ko-KR')}억`)
  if (man > 0) parts.push(`${man.toLocaleString('ko-KR')}만`)
  return `${sign}${parts.join(' ')}원`
}

/** 국가 코드 → 국기 이모지 */
export function flagOf(code: CountryCode): string {
  return String.fromCodePoint(...[...code].map((ch) => 0x1f1e6 + ch.charCodeAt(0) - 65))
}

export function tierInfo(key: TierKey) {
  return TIERS.find((t) => t.key === key) ?? TIERS[0]
}
