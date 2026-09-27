import { STAT_P_RANGE } from '../config'
import { invPhi, Phi } from './normal'
import type { Education } from './types'

export function clamp(x: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, x))
}

export function clampStat(p: number): number {
  return clamp(p, STAT_P_RANGE[0], STAT_P_RANGE[1])
}

/** 지니계수 G인 로그정규분포의 σ = √2 · Φ⁻¹((G+1)/2) */
export function giniToSigma(gini: number): number {
  return Math.SQRT2 * invPhi((gini + 1) / 2)
}

/** 로그정규 근사 백분위. x ≤ 0이면 최하단(0.01). 결과는 스탯 범위로 clamp */
export function lognormalPercentile(x: number, median: number, gini: number): number {
  if (x <= 0) return clampStat(0.01)
  return clampStat(Phi(Math.log(x / median) / giniToSigma(gini)))
}

/** 국가 데이터 edu 배열의 칸 순서 */
const EDU_INDEX: Record<Exclude<Education, 'collegeEnrolled'>, number> = {
  elementary: 0,
  middle: 1,
  high: 2,
  associate: 3,
  bachelor: 4,
  master: 5,
  doctorate: 6,
}

/**
 * 범주형 백분위: (아래 학력 비율 합 + 같은 학력 비율 / 2) / 전체.
 * 비율 합이 100이 아니어도 되도록 전체 합으로 나눈다.
 * "대학 재학"은 고졸과 전문대졸 백분위의 평균.
 */
export function educationPercentile(education: Education, dist: number[]): number {
  if (education === 'collegeEnrolled') {
    return clampStat(
      (educationPercentile('high', dist) + educationPercentile('associate', dist)) / 2,
    )
  }
  const i = EDU_INDEX[education]
  const total = dist.reduce((s, v) => s + v, 0)
  const below = dist.slice(0, i).reduce((s, v) => s + v, 0)
  return clampStat((below + dist[i] / 2) / total)
}
