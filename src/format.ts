import { TIERS } from './config'
import type { CountryCode, TierKey } from './engine/types'

/**
 * 백분위 p → "total명 중 count명 안"의 숫자.
 * 1000명 기준으로 한 자릿수(1~9명)일 때만 1000명, 그 외에는 100명 기준.
 * 100명 중 40명처럼 나누어떨어지면 10명 중 4명으로 줄인다.
 */
export function topRatio(p: number): { total: number; count: number } {
  const top = 1 - p
  const perThousand = Math.round(top * 1000)
  if (perThousand < 10) return { total: 1000, count: Math.max(1, perThousand) }
  const perHundred = Math.round(top * 100)
  if (perHundred % 10 === 0) return { total: 10, count: perHundred / 10 }
  return { total: 100, count: perHundred }
}

/** "1000명 중 8명 안" */
export function ratioLabel(p: number): string {
  const { total, count } = topRatio(p)
  return `${total}명 중 ${count}명 안`
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
