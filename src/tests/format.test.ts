import { describe, expect, it } from 'vitest'
import { formatManwon, ratioLabel, topRatio } from '../format'

describe('비율 표기', () => {
  it('상위 0.8% → 1000명 중 8명', () => {
    expect(topRatio(0.992)).toEqual({ total: 1000, count: 8 })
    expect(ratioLabel(0.992)).toBe('1000명 중 8명 안')
  })

  it('1% 이상은 100명 기준', () => {
    expect(topRatio(0.66)).toEqual({ total: 100, count: 34 })
    expect(topRatio(0.916)).toEqual({ total: 100, count: 8 })
    expect(topRatio(0.151)).toEqual({ total: 100, count: 85 })
  })

  it('나누어떨어지면 10명 기준으로 줄인다', () => {
    expect(topRatio(0.6)).toEqual({ total: 10, count: 4 })
    expect(ratioLabel(0.6)).toBe('10명 중 4명 안')
    expect(topRatio(0.9)).toEqual({ total: 10, count: 1 })
    expect(topRatio(0.2)).toEqual({ total: 10, count: 8 })
  })

  it('경계: 1000명 중 10명이 되면 100명 중 1명으로', () => {
    expect(topRatio(0.99)).toEqual({ total: 100, count: 1 })
    expect(topRatio(0.99001)).toEqual({ total: 100, count: 1 })
    expect(topRatio(0.9906)).toEqual({ total: 1000, count: 9 })
  })

  it('최상단도 최소 1명', () => {
    expect(topRatio(0.99915)).toEqual({ total: 1000, count: 1 })
    expect(topRatio(0.9999)).toEqual({ total: 1000, count: 1 })
  })
})

describe('만원 표기', () => {
  it('억·만 단위', () => {
    expect(formatManwon(3000)).toBe('3,000만원')
    expect(formatManwon(12000)).toBe('1억 2,000만원')
    expect(formatManwon(10000)).toBe('1억원')
    expect(formatManwon(-2500)).toBe('-2,500만원')
    expect(formatManwon(0)).toBe('0원')
  })
})
