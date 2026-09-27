import { describe, expect, it } from 'vitest'
import { KRW_PER_USD } from '../config'
import { calculate, COUNTRIES } from '../engine/calculate'
import { applyBuff, combine, levelOf, tierOf, weightedZ } from '../engine/composite'
import { invPhi, Phi } from '../engine/normal'
import { educationPercentile, lognormalPercentile } from '../engine/percentile'
import type { CalcInput } from '../engine/types'

const base: CalcInput = {
  ageGroup: '30s',
  comparison: 'sameAge',
  incomeManwon: 3000,
  noIncome: false,
  wealthManwon: 5000,
  education: 'bachelor',
  rarity: 'regular',
  rarityAffectsLevel: false,
  country: 'KR',
  mode: 'fx',
}

describe('완료 기준', () => {
  it('invPhi(Phi(z)) ≈ z (z ∈ [-3, 3], 오차 1e-3)', () => {
    for (let i = -300; i <= 300; i++) {
      const z = i / 100
      expect(Math.abs(invPhi(Phi(z)) - z)).toBeLessThan(1e-3)
    }
  })

  it('버프 0, 전체 성인, 대한민국, 소득 = 중위값 → 소득 백분위 0.50 ± 0.01', () => {
    const medianManwon = (COUNTRIES.KR.medianIncome * KRW_PER_USD) / 10_000
    const r = calculate(
      { ...base, comparison: 'allAdults', incomeManwon: medianManwon },
      { buff: 0 },
    )
    expect(r.stats.income.p).toBeCloseTo(0.5, 2)
    expect(Math.abs(r.stats.income.p - 0.5)).toBeLessThanOrEqual(0.01)
  })

  it('대한민국 대졸 학력 백분위 = 0.775', () => {
    expect(educationPercentile('bachelor', COUNTRIES.KR.edu)).toBeCloseTo(0.775, 10)
  })

  it('스탯 백분위 0.5 세 개 → 종합 0.50 ± 0.01', () => {
    const r = combine(
      [
        { key: 'income', p: 0.5, locked: false },
        { key: 'wealth', p: 0.5, locked: false },
        { key: 'education', p: 0.5, locked: false },
      ],
      { buff: 0 },
    )
    expect(Math.abs(r.p - 0.5)).toBeLessThanOrEqual(0.01)
  })

  it('버프: p = .10 → .235, p = .90 → .915', () => {
    expect(applyBuff(0.1, 0.15)).toBeCloseTo(0.235, 10)
    expect(applyBuff(0.9, 0.15)).toBeCloseTo(0.915, 10)
  })

  it('대상국을 대한민국 → 짐바브웨로 바꾸면 종합 백분위가 오른다', () => {
    for (const mode of ['fx', 'ppp'] as const) {
      const kr = calculate({ ...base, mode, country: 'KR' })
      const zw = calculate({ ...base, mode, country: 'ZW' })
      expect(zw.composite.p).toBeGreaterThan(kr.composite.p)
    }
  })

  it('대상국이 대한민국이면 환율 모드와 구매력 모드 결과가 같다', () => {
    const inputs: CalcInput[] = [
      base,
      { ...base, noIncome: true, wealthManwon: -2000, education: 'collegeEnrolled' },
      { ...base, ageGroup: '60plus', comparison: 'allAdults', incomeManwon: 12000 },
    ]
    for (const input of inputs) {
      const fx = calculate({ ...input, country: 'KR', mode: 'fx' })
      const ppp = calculate({ ...input, country: 'KR', mode: 'ppp' })
      expect(ppp).toEqual(fx)
    }
  })

  it('"소득 없음" 체크 시 남은 가중치 합이 1이 된다', () => {
    const r = calculate({ ...base, noIncome: true })
    const w = r.composite.weights
    expect(w.income).toBeUndefined()
    expect((w.wealth ?? 0) + (w.education ?? 0)).toBeCloseTo(1, 10)
    expect(r.stats.income.locked).toBe(true)
    expect(r.brightest).not.toBe('income')
  })
})

describe('세부 동작', () => {
  it('x ≤ 0이면 스탯 백분위는 0.01', () => {
    expect(lognormalPercentile(0, 20000, 0.36)).toBe(0.01)
    expect(lognormalPercentile(-500, 20000, 0.36)).toBe(0.01)
  })

  it('스탯 백분위는 [0.01, 0.99]로 clamp', () => {
    expect(lognormalPercentile(1e12, 20000, 0.36)).toBe(0.99)
    expect(lognormalPercentile(1e-6, 20000, 0.36)).toBe(0.01)
  })

  it('"대학 재학" = 고졸과 전문대졸 백분위의 평균', () => {
    const edu = COUNTRIES.KR.edu
    const expected = (educationPercentile('high', edu) + educationPercentile('associate', edu)) / 2
    expect(educationPercentile('collegeEnrolled', edu)).toBeCloseTo(expected, 10)
  })

  it('종합 분모는 wᵀRw로 계산된다 (단일 스탯이면 z 그대로)', () => {
    expect(weightedZ([{ w: 1, z: 1.3 }])).toBeCloseTo(1.3, 10)
    const w = [0.4, 0.35, 0.25]
    const expectedDenom = Math.sqrt(
      w.reduce((s, a, i) => s + w.reduce((t, b, j) => t + a * b * (i === j ? 1 : 0.4), 0), 0),
    )
    expect(weightedZ(w.map((x) => ({ w: x, z: 1 })), 0.4)).toBeCloseTo(1 / expectedDenom, 10)
  })

  it('종합 백분위는 [0.001, 0.999]로 clamp', () => {
    const top = combine(
      [
        { key: 'income', p: 0.99, locked: false },
        { key: 'wealth', p: 0.99, locked: false },
        { key: 'education', p: 0.99, locked: false },
      ],
      { buff: 0, rarityBonus: 5 },
    )
    expect(top.rawP).toBe(0.999)
  })

  it('레어도 반영 on이면 z에 가산값이 더해지고, off면 그대로', () => {
    const off = calculate({ ...base, rarity: 'rare', rarityAffectsLevel: false })
    const on = calculate({ ...base, rarity: 'rare', rarityAffectsLevel: true })
    expect(off.composite.rarityBonus).toBe(0)
    expect(on.composite.z - off.composite.z).toBeCloseTo(0.3, 10)
    expect(on.composite.p).toBeGreaterThan(off.composite.p)
  })

  it('버프는 종합과 각 스탯 막대 모두에 적용된다', () => {
    const r = calculate(base, { buff: 0.15 })
    expect(r.composite.p).toBeCloseTo(applyBuff(r.composite.rawP, 0.15), 10)
    for (const s of Object.values(r.stats)) {
      expect(s.p).toBeCloseTo(applyBuff(s.rawP, 0.15), 10)
    }
  })

  it('구매력 모드는 소득·자산에 PLI 비율을 곱한다', () => {
    const r = calculate({ ...base, country: 'US', mode: 'ppp' })
    expect(r.trace.f).toBeCloseTo(COUNTRIES.US.pli / COUNTRIES.KR.pli, 10)
  })

  it('같은 나이대 비교는 중위값에 나이 배수를 곱한다', () => {
    const r = calculate({ ...base, ageGroup: '20s' })
    expect(r.trace.medianIncome).toBeCloseTo(COUNTRIES.KR.medianIncome * 0.7, 6)
    expect(r.trace.medianWealth).toBeCloseTo(COUNTRIES.KR.medianWealth * 0.2, 6)
    const all = calculate({ ...base, ageGroup: '20s', comparison: 'allAdults' })
    expect(all.trace.medianIncome).toBe(COUNTRIES.KR.medianIncome)
  })

  it('레벨과 티어', () => {
    expect(levelOf(0)).toBe(1)
    expect(levelOf(0.5)).toBe(50)
    expect(levelOf(0.999)).toBe(99)
    expect(tierOf(0.19)).toBe('bronze')
    expect(tierOf(0.2)).toBe('silver')
    expect(tierOf(0.59)).toBe('gold')
    expect(tierOf(0.79)).toBe('platinum')
    expect(tierOf(0.94)).toBe('diamond')
    expect(tierOf(0.98)).toBe('master')
    expect(tierOf(0.99)).toBe('challenger')
  })
})
