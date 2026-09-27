import { BUFF, COMPOSITE_P_RANGE, STAT_CORRELATION, TIERS, WEIGHTS } from '../config'
import { invPhi, Phi } from './normal'
import { clamp } from './percentile'
import type { CompositeResult, StatKey, TierKey } from './types'

export interface StatInput {
  key: StatKey
  /** 버프 전 스탯 백분위 */
  p: number
  locked: boolean
}

/** 잠기지 않은 스탯의 가중치를 합 1로 재정규화 */
export function normalizeWeights(active: StatKey[]): Partial<Record<StatKey, number>> {
  const total = active.reduce((s, k) => s + WEIGHTS[k], 0)
  const out: Partial<Record<StatKey, number>> = {}
  for (const k of active) out[k] = WEIGHTS[k] / total
  return out
}

/**
 * z = Σ wᵢzᵢ / √(wᵀRw), R은 대각 1·비대각 ρ인 상관행렬.
 * 상관된 표준정규 스탯들의 가중합을 다시 표준정규로 맞춘다.
 */
export function weightedZ(items: { w: number; z: number }[], rho = STAT_CORRELATION): number {
  if (items.length === 0) return 0
  let num = 0
  let variance = 0
  for (let i = 0; i < items.length; i++) {
    num += items[i].w * items[i].z
    for (let j = 0; j < items.length; j++) {
      variance += items[i].w * items[j].w * (i === j ? 1 : rho)
    }
  }
  return num / Math.sqrt(variance)
}

/** p' = p + (1 − p) × buff */
export function applyBuff(p: number, buff = BUFF): number {
  return p + (1 - p) * buff
}

export function levelOf(p: number): number {
  return Math.max(1, Math.round(p * 99))
}

export function tierOf(p: number): TierKey {
  return (TIERS.find((t) => p < t.max) ?? TIERS[TIERS.length - 1]).key
}

export function combine(
  stats: StatInput[],
  opts: { rarityBonus?: number; buff?: number } = {},
): CompositeResult {
  const rarityBonus = opts.rarityBonus ?? 0
  const buff = opts.buff ?? BUFF

  const active = stats.filter((s) => !s.locked)
  const weights = normalizeWeights(active.map((s) => s.key))
  const baseZ = weightedZ(active.map((s) => ({ w: weights[s.key] ?? 0, z: invPhi(s.p) })))
  const z = baseZ + rarityBonus
  const rawP = clamp(Phi(z), COMPOSITE_P_RANGE[0], COMPOSITE_P_RANGE[1])
  const p = applyBuff(rawP, buff)

  return { weights, baseZ, rarityBonus, z, rawP, p, level: levelOf(p), tier: tierOf(p) }
}
