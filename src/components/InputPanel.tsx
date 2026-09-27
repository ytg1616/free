import { useId, type ReactNode } from 'react'
import { AGE_GROUPS, COMPARISONS, EDUCATIONS } from '../config'
import { formatManwon } from '../format'
import { sanitizeDigits, type FormState } from '../form'
import RarityInput from './RarityInput'

interface Props {
  form: FormState
  onChange: (patch: Partial<FormState>) => void
}

interface ChipOption<K extends string> {
  key: K
  label: string
}

function Chips<K extends string>(props: {
  label: string
  options: ChipOption<K>[]
  value: K | null
  onSelect: (key: K) => void
  columns?: number
}) {
  return (
    <div
      className={`chips chips-${props.columns ?? props.options.length}`}
      role="radiogroup"
      aria-label={props.label}
    >
      {props.options.map((o) => (
        <button
          key={o.key}
          type="button"
          role="radio"
          aria-checked={props.value === o.key}
          className={`chip${props.value === o.key ? ' is-selected' : ''}`}
          onClick={() => props.onSelect(o.key)}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

function Field(props: { label: string; htmlFor?: string; children: ReactNode }) {
  return (
    <div className="field">
      {props.htmlFor ? (
        <label className="field-label" htmlFor={props.htmlFor}>
          {props.label}
        </label>
      ) : (
        <div className="field-label">{props.label}</div>
      )}
      {props.children}
    </div>
  )
}

export default function InputPanel({ form, onChange }: Props) {
  const incomeId = useId()
  const wealthId = useId()
  const wealthValue = form.wealth === '' ? null : Number(form.wealth) * (form.wealthNegative ? -1 : 1)

  return (
    <section className="panel input-panel" aria-label="내 스탯 입력">
      <Field label="나이대">
        <Chips
          label="나이대"
          options={AGE_GROUPS}
          value={form.ageGroup}
          onSelect={(ageGroup) => onChange({ ageGroup })}
          columns={5}
        />
      </Field>

      <Field label="비교 대상">
        <Chips
          label="비교 대상"
          options={COMPARISONS}
          value={form.comparison}
          onSelect={(comparison) => onChange({ comparison })}
        />
      </Field>

      <Field label="연 소득" htmlFor={incomeId}>
        <div className={`money${form.noIncome ? ' is-disabled' : ''}`}>
          <input
            id={incomeId}
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            autoComplete="off"
            placeholder="예: 3500"
            value={form.noIncome ? '' : form.income}
            disabled={form.noIncome}
            onChange={(e) => onChange({ income: sanitizeDigits(e.target.value) })}
          />
          <span className="unit">만원</span>
        </div>
        <div className="field-foot">
          <label className="check">
            <input
              type="checkbox"
              checked={form.noIncome}
              onChange={(e) => onChange({ noIncome: e.target.checked })}
            />
            소득 없음(학생 등)
          </label>
          {!form.noIncome && form.income !== '' && (
            <span className="hint">{formatManwon(Number(form.income))}</span>
          )}
        </div>
      </Field>

      <Field label="순자산" htmlFor={wealthId}>
        <div className="money">
          <button
            type="button"
            className={`sign${form.wealthNegative ? ' is-negative' : ''}`}
            aria-label={form.wealthNegative ? '마이너스 자산 (누르면 플러스로)' : '플러스 자산 (누르면 마이너스로)'}
            aria-pressed={form.wealthNegative}
            onClick={() => onChange({ wealthNegative: !form.wealthNegative })}
          >
            {form.wealthNegative ? '−' : '+'}
          </button>
          <input
            id={wealthId}
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            autoComplete="off"
            placeholder="예: 8000"
            value={form.wealth}
            onChange={(e) => onChange({ wealth: sanitizeDigits(e.target.value) })}
          />
          <span className="unit">만원</span>
        </div>
        <div className="field-foot">
          <span className="hint">빚이 더 많으면 ± 버튼으로 마이너스</span>
          {wealthValue !== null && <span className="hint">{formatManwon(wealthValue)}</span>}
        </div>
      </Field>

      <Field label="학력">
        <Chips
          label="학력"
          options={EDUCATIONS}
          value={form.education}
          onSelect={(education) => onChange({ education })}
          columns={4}
        />
      </Field>

      <Field label="직업 레어도">
        <RarityInput value={form.rarity} onChange={(rarity) => onChange({ rarity })} />
        <label className="switch">
          <input
            type="checkbox"
            role="switch"
            checked={form.rarityAffectsLevel}
            onChange={(e) => onChange({ rarityAffectsLevel: e.target.checked })}
          />
          <span className="switch-track" aria-hidden="true" />
          레어도를 레벨에 반영
        </label>
      </Field>
    </section>
  )
}
