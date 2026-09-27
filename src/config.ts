import type {
  AgeGroup,
  Comparison,
  ConversionMode,
  CountryCode,
  Education,
  Rarity,
  StatKey,
  TierKey,
} from './engine/types'

export const APP_TITLE = '평행세계 레벨 계산기'

/** 거주국 (Phase 1은 대한민국 고정, 원화 입력) */
export const HOME_COUNTRY: CountryCode = 'KR'

/** 원/달러 환율 (임시값) */
export const KRW_PER_USD = 1380

/** 종합 가중치 (합 1) */
export const WEIGHTS: Record<StatKey, number> = {
  income: 0.4,
  wealth: 0.35,
  education: 0.25,
}

/** 스탯 간 상관계수 ρ */
export const STAT_CORRELATION = 0.4

/** 결과 상향 보정 비율: p' = p + (1 − p) × BUFF */
export const BUFF = 0.15

/** 스탯 백분위 clamp 범위 */
export const STAT_P_RANGE = [0.01, 0.99] as const

/** 종합 백분위 clamp 범위 */
export const COMPOSITE_P_RANGE = [0.001, 0.999] as const

/** 티어: 백분위가 max 미만이면 해당 티어 (마지막은 그 이상 전부) */
export const TIERS: { key: TierKey; name: string; max: number; color: string }[] = [
  { key: 'bronze', name: '브론즈', max: 0.2, color: '#c98a55' },
  { key: 'silver', name: '실버', max: 0.4, color: '#b9c3cf' },
  { key: 'gold', name: '골드', max: 0.6, color: '#f2c14e' },
  { key: 'platinum', name: '플래티넘', max: 0.8, color: '#4fd1c5' },
  { key: 'diamond', name: '다이아', max: 0.95, color: '#6ea8ff' },
  { key: 'master', name: '마스터', max: 0.99, color: '#b77bff' },
  { key: 'challenger', name: '챌린저', max: Infinity, color: '#ff6b93' },
]

/** 레어도 반영 on일 때 종합 z에 더하는 값 (임시값) */
export const RARITY_BONUS: Record<Rarity, number> = {
  common: 0,
  regular: 0.05,
  scarce: 0.15,
  rare: 0.3,
}

export const RARITY_INFO: Record<Rarity, { label: string; color: string }> = {
  common: { label: '흔함', color: '#a3acb7' },
  regular: { label: '보통', color: '#5fd068' },
  scarce: { label: '드묾', color: '#4aa3ff' },
  rare: { label: '희귀', color: '#b36bff' },
}

export const RARITY_ORDER: Rarity[] = ['common', 'regular', 'scarce', 'rare']

/** 같은 나이대 비교 시 대상국 중위값에 곱하는 배수 (전 국가 공통 임시값) */
export const AGE_MULT: Record<'income' | 'wealth', Record<AgeGroup, number>> = {
  income: { '20s': 0.7, '30s': 1.0, '40s': 1.15, '50s': 1.1, '60plus': 0.6 },
  wealth: { '20s': 0.2, '30s': 0.6, '40s': 1.1, '50s': 1.5, '60plus': 1.6 },
}

export const AGE_GROUPS: { key: AgeGroup; label: string }[] = [
  { key: '20s', label: '20대' },
  { key: '30s', label: '30대' },
  { key: '40s', label: '40대' },
  { key: '50s', label: '50대' },
  { key: '60plus', label: '60대 이상' },
]

export const COMPARISONS: { key: Comparison; label: string }[] = [
  { key: 'sameAge', label: '같은 나이대' },
  { key: 'allAdults', label: '전체 성인' },
]

export const EDUCATIONS: { key: Education; label: string }[] = [
  { key: 'elementary', label: '초졸 이하' },
  { key: 'middle', label: '중졸' },
  { key: 'high', label: '고졸' },
  { key: 'collegeEnrolled', label: '대학 재학' },
  { key: 'associate', label: '전문대졸' },
  { key: 'bachelor', label: '대졸' },
  { key: 'master', label: '석사' },
  { key: 'doctorate', label: '박사' },
]

export const MODES: { key: ConversionMode; label: string; hint: string }[] = [
  { key: 'fx', label: '환율', hint: '돈 들고 가면' },
  { key: 'ppp', label: '구매력', hint: '생활수준 기준' },
]

export const STAT_LABELS: Record<StatKey, string> = {
  income: '소득',
  wealth: '자산',
  education: '학력',
}
