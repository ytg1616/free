import type { Ref } from 'react'
import { AGE_GROUPS, COMPARISONS, HOME_COUNTRY, MODES } from '../config'
import { COUNTRIES } from '../engine/calculate'
import type { CalcResult } from '../engine/types'
import { flagOf, tierInfo } from '../format'
import type { FormState } from '../form'
import BellCurve from './BellCurve'
import CountryPicker from './CountryPicker'
import RarityBadge from './RarityBadge'
import ResultCards from './ResultCards'
import StatBars from './StatBars'

interface Props {
  form: FormState
  result: CalcResult
  /** 대한민국 기준 결과 (다른 나라를 볼 때만) */
  homeResult: CalcResult | null
  onChange: (patch: Partial<FormState>) => void
  ref?: Ref<HTMLElement>
}

export default function ResultSection({ form, result, homeResult, onChange, ref }: Props) {
  const tier = tierInfo(result.composite.tier)
  const country = COUNTRIES[result.country]
  const away = result.country !== HOME_COUNTRY
  const group =
    form.comparison === 'sameAge'
      ? AGE_GROUPS.find((a) => a.key === form.ageGroup)?.label
      : COMPARISONS.find((c) => c.key === 'allAdults')?.label
  const basis = [`${group} 사이에서`, away ? MODES.find((m) => m.key === form.mode)?.hint : null]
    .filter(Boolean)
    .join(' · ')

  return (
    <section className="result-section" ref={ref} aria-label="결과">
      <div className="panel">
        <h2 className="section-title">어느 세계에서 볼까요?</h2>
        <CountryPicker
          country={form.country}
          mode={form.mode}
          onCountry={(c) => onChange({ country: c })}
          onMode={(mode) => onChange({ mode })}
        />
      </div>

      <div className="panel chart-panel">
        <div className="chart-head">
          <h2>
            <span aria-hidden="true">{flagOf(result.country)}</span> {country.name}에서의 나
          </h2>
          <span className="chart-basis">{basis}</span>
        </div>
        <BellCurve
          p={result.composite.p}
          color={tier.color}
          baseline={
            homeResult
              ? { p: homeResult.composite.p, label: `${flagOf(HOME_COUNTRY)} ${COUNTRIES[HOME_COUNTRY].name}` }
              : null
          }
        />
        <ResultCards composite={result.composite} />
        {form.rarity && (
          <div className="badge-row">
            <RarityBadge rarity={form.rarity} />
          </div>
        )}
      </div>

      <div className="panel">
        <h2 className="section-title">스탯</h2>
        <StatBars result={result} />
      </div>
    </section>
  )
}

export function EmptyGuide({ missing }: { missing: string[] }) {
  return (
    <section className="panel empty-guide" aria-live="polite">
      <div className="empty-icon" aria-hidden="true">🌏</div>
      <p className="empty-title">스탯을 입력하면 평행세계 속 내 레벨이 나타나요</p>
      {missing.length > 0 && (
        <p className="empty-missing">
          남은 입력 <strong>{missing.join(' · ')}</strong>
        </p>
      )}
    </section>
  )
}
