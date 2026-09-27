import { describe, expect, it } from 'vitest'
import { calculate } from '../engine/calculate'
import { levelOf, tierOf } from '../engine/composite'
import { initialForm, toCalcInput, type FormState } from '../form'
import { topRatio } from '../format'
import { decodeShare, encodeShare, shareUrl, toShareData, type ShareData } from '../share'

const form: FormState = {
  ...initialForm,
  ageGroup: '30s',
  income: '3000',
  wealth: '5000',
  education: 'bachelor',
  rarity: 'rare',
  country: 'VN',
}

function sample(f: FormState = form): ShareData {
  const input = toCalcInput(f)!
  const result = calculate(input)
  const home = input.country !== 'KR' ? calculate({ ...input, country: 'KR' }) : null
  return toShareData(f, result, home)
}

describe('공유 링크', () => {
  it('인코딩 → 디코딩하면 같은 결과가 보인다', () => {
    const d = sample()
    const back = decodeShare('#' + encodeShare(d))!
    expect(back).not.toBeNull()
    expect(back.country).toBe('VN')
    expect(back.group).toBe('30s')
    expect(back.rarity).toBe('rare')
    expect(back.brightest).toBe(d.brightest)
    expect(levelOf(back.p)).toBe(levelOf(d.p))
    expect(tierOf(back.p)).toBe(tierOf(d.p))
    expect(topRatio(back.p)).toEqual(topRatio(d.p))
    expect(levelOf(back.homeP!)).toBe(levelOf(d.homeP!))
  })

  it('링크에는 결과 값만 담기고 입력값은 담기지 않는다', () => {
    const q = new URLSearchParams(encodeShare(sample()))
    expect([...q.keys()].sort()).toEqual(['b', 'c', 'g', 'h', 'm', 'p', 'r', 'v'])
    for (const key of ['p', 'h']) expect(q.get(key)).toMatch(/^\d{1,7}$/)
    // 입력한 금액·학력 값이 그대로 들어간 칸이 없어야 한다
    const values = [...q.values()]
    for (const input of ['3000', '5000', 'bachelor', '30000000', '50000000']) {
      expect(values).not.toContain(input)
    }
  })

  it('링크는 # 뒤에만 담긴다 (서버로 전송되지 않음)', () => {
    expect(shareUrl(sample()).startsWith('#')).toBe(true)
  })

  it('대한민국 결과면 대한민국 기준 값은 빠진다', () => {
    const d = sample({ ...form, country: 'KR' })
    expect(d.homeP).toBeNull()
    expect(new URLSearchParams(encodeShare(d)).has('h')).toBe(false)
  })

  it('전체 성인 비교는 group=all, 레어도 미선택은 생략', () => {
    const d = sample({ ...form, comparison: 'allAdults', rarity: null })
    expect(d.group).toBe('all')
    expect(new URLSearchParams(encodeShare(d)).has('r')).toBe(false)
    expect(decodeShare('#' + encodeShare(d))!.rarity).toBeNull()
  })

  it('형식이 틀리거나 조작된 링크는 무시한다', () => {
    const ok = new URLSearchParams(encodeShare(sample()))
    const bad = (patch: Record<string, string>) => {
      const q = new URLSearchParams(ok)
      for (const [k, v] of Object.entries(patch)) q.set(k, v)
      return decodeShare('#' + q.toString())
    }
    expect(decodeShare('')).toBeNull()
    expect(decodeShare('#hello')).toBeNull()
    expect(bad({ v: '2' })).toBeNull()
    expect(bad({ c: 'XX' })).toBeNull()
    expect(bad({ g: '10s' })).toBeNull()
    expect(bad({ m: 'magic' })).toBeNull()
    expect(bad({ p: '0' })).toBeNull()
    expect(bad({ p: '1000000' })).toBeNull()
    expect(bad({ p: '-5' })).toBeNull()
    expect(bad({ p: '0.5' })).toBeNull()
    // 부가 정보가 이상하면 그 항목만 버린다
    expect(bad({ r: 'mythic' })!.rarity).toBeNull()
    expect(bad({ b: 'charm' })!.brightest).toBeNull()
    expect(bad({ h: 'abc' })!.homeP).toBeNull()
  })
})
