import type countries from '../data/countries.json'

export type CountryCode = keyof typeof countries

export interface CountryData {
  name: string
  /** 근로소득자 1인 연소득 중위값 (USD, 시장환율) */
  medianIncome: number
  incomeGini: number
  /** 성인 1인 순자산 중위값 (USD, 시장환율) */
  medianWealth: number
  wealthGini: number
  /** 미국 대비 물가수준 */
  pli: number
  /** 25~64세 학력 비율(%) [초졸 이하, 중졸, 고졸, 전문대졸, 대졸, 석사, 박사] */
  edu: number[]
  verified: boolean
}

export type AgeGroup = '20s' | '30s' | '40s' | '50s' | '60plus'

/** sameAge: 같은 나이대 / allAdults: 전체 성인 */
export type Comparison = 'sameAge' | 'allAdults'

export type Education =
  | 'elementary'
  | 'middle'
  | 'high'
  | 'collegeEnrolled'
  | 'associate'
  | 'bachelor'
  | 'master'
  | 'doctorate'

export type Rarity = 'common' | 'regular' | 'scarce' | 'rare'

/** fx: 환율("돈 들고 가면") / ppp: 구매력("생활수준 기준") */
export type ConversionMode = 'fx' | 'ppp'

export type StatKey = 'income' | 'wealth' | 'education'

export type TierKey =
  | 'bronze'
  | 'silver'
  | 'gold'
  | 'platinum'
  | 'diamond'
  | 'master'
  | 'challenger'

export interface CalcInput {
  ageGroup: AgeGroup
  comparison: Comparison
  /** 연 소득 (만원) */
  incomeManwon: number
  /** "소득 없음(학생 등)" — 소득을 잠긴 스탯으로 두고 종합에서 제외 */
  noIncome: boolean
  /** 순자산 (만원, 음수 허용) */
  wealthManwon: number
  education: Education
  /** 선택하지 않으면 뱃지도 가산도 없음 */
  rarity: Rarity | null
  rarityAffectsLevel: boolean
  country: CountryCode
  mode: ConversionMode
}

export interface CalcOptions {
  /** 응원 버프. 기본값은 config.BUFF */
  buff?: number
}

export interface StatResult {
  key: StatKey
  locked: boolean
  /** 버프 전 백분위 (clamp 적용) */
  rawP: number
  /** 버프 후 백분위 — 화면에 쓰는 값 */
  p: number
  /** invPhi(rawP) */
  z: number
}

export interface CompositeResult {
  /** 종합에 쓰인 가중치 (잠긴 스탯 제외 후 합 1) */
  weights: Partial<Record<StatKey, number>>
  /** 가중합을 표준화한 z (레어도 가산 전) */
  baseZ: number
  rarityBonus: number
  /** 레어도 가산 후 z */
  z: number
  /** clamp(Phi(z)) — 버프 전 */
  rawP: number
  /** 버프 후 백분위 — 화면에 쓰는 값 */
  p: number
  level: number
  tier: TierKey
}

export interface CalcResult {
  country: CountryCode
  stats: Record<StatKey, StatResult>
  composite: CompositeResult
  /** 잠기지 않은 스탯 중 가장 높은 것 */
  brightest: StatKey | null
  /** 디버그용 중간값 */
  trace: {
    buff: number
    incomeUsd: number
    wealthUsd: number
    /** 환산 계수 */
    f: number
    medianIncome: number
    medianWealth: number
    incomeSigma: number
    wealthSigma: number
  }
}
