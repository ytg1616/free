import { HOME_COUNTRY } from './config'
import type {
  AgeGroup,
  CalcInput,
  Comparison,
  ConversionMode,
  CountryCode,
  Education,
  Rarity,
} from './engine/types'

/** 화면 입력 상태. 숫자 칸은 빈 값을 구분하려고 문자열로 둔다 */
export interface FormState {
  ageGroup: AgeGroup | null
  comparison: Comparison
  income: string
  noIncome: boolean
  /** 순자산 절댓값 (숫자만) */
  wealth: string
  /** ± 버튼 — 아이폰 숫자 키패드에 마이너스가 없어서 부호를 따로 받는다 */
  wealthNegative: boolean
  education: Education | null
  rarity: Rarity | null
  rarityAffectsLevel: boolean
  country: CountryCode
  mode: ConversionMode
}

export const initialForm: FormState = {
  ageGroup: null,
  comparison: 'sameAge',
  income: '',
  noIncome: false,
  wealth: '',
  wealthNegative: false,
  education: null,
  rarity: null,
  rarityAffectsLevel: false,
  country: HOME_COUNTRY,
  mode: 'fx',
}

/** 결과를 내려면 아직 채워야 하는 항목 */
export function missingFields(form: FormState): string[] {
  const missing: string[] = []
  if (!form.ageGroup) missing.push('나이대')
  if (!form.noIncome && form.income === '') missing.push('연 소득')
  if (form.wealth === '') missing.push('순자산')
  if (!form.education) missing.push('학력')
  return missing
}

export function toCalcInput(form: FormState): CalcInput | null {
  if (!form.ageGroup || !form.education) return null
  if (missingFields(form).length > 0) return null
  const wealth = Number(form.wealth)
  return {
    ageGroup: form.ageGroup,
    comparison: form.comparison,
    incomeManwon: form.noIncome ? 0 : Number(form.income),
    noIncome: form.noIncome,
    wealthManwon: form.wealthNegative ? -wealth : wealth,
    education: form.education,
    rarity: form.rarity,
    rarityAffectsLevel: form.rarityAffectsLevel,
    country: form.country,
    mode: form.mode,
  }
}

/** 숫자 칸 입력 정리: 숫자만, 최대 9자리, 앞자리 0 제거 */
export function sanitizeDigits(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 9)
  return digits.replace(/^0+(?=\d)/, '')
}
