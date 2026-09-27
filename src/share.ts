import { AGE_GROUPS, HOME_COUNTRY, RARITY_ORDER } from './config'
import { COUNTRIES } from './engine/calculate'
import type {
  AgeGroup,
  CalcResult,
  ConversionMode,
  CountryCode,
  Rarity,
  StatKey,
} from './engine/types'
import type { FormState } from './form'

/**
 * 공유 링크에 담는 값 — 결과만 담고 입력값(소득·자산 금액, 학력)은 담지 않는다.
 * URL의 # 뒤(fragment)에 넣어서 서버로도 전송되지 않는다.
 */
export interface ShareData {
  country: CountryCode
  /** 비교 집단: 나이대 또는 전체 성인 */
  group: AgeGroup | 'all'
  mode: ConversionMode
  /** 화면에 보인 종합 백분위 */
  p: number
  /** 대한민국 기준 종합 백분위 (다른 나라일 때만) */
  homeP: number | null
  rarity: Rarity | null
  brightest: StatKey | null
}

const VERSION = '1'
const SCALE = 1_000_000
const STAT_KEYS: StatKey[] = ['income', 'wealth', 'education']

export function toShareData(form: FormState, result: CalcResult, home: CalcResult | null): ShareData {
  return {
    country: result.country,
    group: form.comparison === 'sameAge' && form.ageGroup ? form.ageGroup : 'all',
    mode: form.mode,
    p: result.composite.p,
    homeP: home ? home.composite.p : null,
    rarity: form.rarity,
    brightest: result.brightest,
  }
}

/** ShareData → URL fragment 문자열 (# 제외) */
export function encodeShare(d: ShareData): string {
  const q = new URLSearchParams({
    v: VERSION,
    c: d.country,
    g: d.group,
    m: d.mode,
    p: String(Math.round(d.p * SCALE)),
  })
  if (d.homeP !== null) q.set('h', String(Math.round(d.homeP * SCALE)))
  if (d.rarity) q.set('r', d.rarity)
  if (d.brightest) q.set('b', d.brightest)
  return q.toString()
}

function parseP(raw: string | null): number | null {
  if (raw === null || !/^\d{1,7}$/.test(raw)) return null
  const n = Number(raw) / SCALE
  return n > 0 && n < 1 ? n : null
}

function oneOf<T extends string>(raw: string | null, allowed: readonly T[]): T | null {
  return raw !== null && (allowed as readonly string[]).includes(raw) ? (raw as T) : null
}

/** URL fragment → ShareData. 형식이 맞지 않으면 null (일반 화면으로) */
export function decodeShare(hash: string): ShareData | null {
  const q = new URLSearchParams(hash.replace(/^#/, ''))
  if (q.get('v') !== VERSION) return null

  const country = oneOf(q.get('c'), Object.keys(COUNTRIES) as CountryCode[])
  const group = oneOf(q.get('g'), [...AGE_GROUPS.map((a) => a.key), 'all'] as const)
  const mode = oneOf(q.get('m'), ['fx', 'ppp'] as const)
  const p = parseP(q.get('p'))
  if (!country || !group || !mode || p === null) return null

  const homeP = country === HOME_COUNTRY ? null : parseP(q.get('h'))
  return {
    country,
    group,
    mode,
    p,
    homeP,
    rarity: oneOf(q.get('r'), RARITY_ORDER),
    brightest: oneOf(q.get('b'), STAT_KEYS),
  }
}

export function groupLabel(group: ShareData['group']): string {
  return group === 'all' ? '전체 성인' : (AGE_GROUPS.find((a) => a.key === group)?.label ?? '')
}

/** 현재 페이지 주소 기준 공유 링크 (쿼리·기존 fragment 제거) */
export function shareUrl(d: ShareData): string {
  const base = typeof window === 'undefined' ? '' : `${window.location.origin}${window.location.pathname}`
  return `${base}#${encodeShare(d)}`
}
