import { AGE_MULT, BUFF, HOME_COUNTRY, KRW_PER_USD, RARITY_BONUS } from '../config'
import countries from '../data/countries.json'
import { applyBuff, combine } from './composite'
import { invPhi } from './normal'
import { educationPercentile, giniToSigma, lognormalPercentile } from './percentile'
import type {
  CalcInput,
  CalcOptions,
  CalcResult,
  CountryCode,
  CountryData,
  StatKey,
  StatResult,
} from './types'

export const COUNTRIES = countries as Record<CountryCode, CountryData>
export const COUNTRY_CODES = Object.keys(COUNTRIES) as CountryCode[]

const MANWON = 10_000

/** 환산 계수: 환율 모드는 1, 구매력 모드는 PLI[대상국] / PLI[거주국] */
export function conversionFactor(country: CountryCode, mode: CalcInput['mode']): number {
  return mode === 'ppp' ? COUNTRIES[country].pli / COUNTRIES[HOME_COUNTRY].pli : 1
}

/** 입력 → 대상국 기준 결과. 브라우저 안에서만 도는 순수 함수 */
export function calculate(input: CalcInput, opts: CalcOptions = {}): CalcResult {
  const buff = opts.buff ?? BUFF
  const c = COUNTRIES[input.country]
  const f = conversionFactor(input.country, input.mode)

  const incomeUsd = (input.incomeManwon * MANWON) / KRW_PER_USD
  const wealthUsd = (input.wealthManwon * MANWON) / KRW_PER_USD

  const sameAge = input.comparison === 'sameAge'
  const medianIncome = c.medianIncome * (sameAge ? AGE_MULT.income[input.ageGroup] : 1)
  const medianWealth = c.medianWealth * (sameAge ? AGE_MULT.wealth[input.ageGroup] : 1)

  const rawP: Record<StatKey, number> = {
    income: lognormalPercentile(incomeUsd * f, medianIncome, c.incomeGini),
    wealth: lognormalPercentile(wealthUsd * f, medianWealth, c.wealthGini),
    education: educationPercentile(input.education, c.edu),
  }
  const locked: Record<StatKey, boolean> = {
    income: input.noIncome,
    wealth: false,
    education: false,
  }

  const keys: StatKey[] = ['income', 'wealth', 'education']
  const stats = Object.fromEntries(
    keys.map((key): [StatKey, StatResult] => [
      key,
      { key, locked: locked[key], rawP: rawP[key], p: applyBuff(rawP[key], buff), z: invPhi(rawP[key]) },
    ]),
  ) as Record<StatKey, StatResult>

  const rarityBonus =
    input.rarityAffectsLevel && input.rarity ? RARITY_BONUS[input.rarity] : 0
  const composite = combine(
    keys.map((key) => ({ key, p: rawP[key], locked: locked[key] })),
    { rarityBonus, buff },
  )

  const brightest =
    keys
      .filter((k) => !locked[k])
      .reduce<StatKey | null>((best, k) => (best === null || rawP[k] > rawP[best] ? k : best), null)

  return {
    country: input.country,
    stats,
    composite,
    brightest,
    trace: {
      buff,
      incomeUsd,
      wealthUsd,
      f,
      medianIncome,
      medianWealth,
      incomeSigma: giniToSigma(c.incomeGini),
      wealthSigma: giniToSigma(c.wealthGini),
    },
  }
}
