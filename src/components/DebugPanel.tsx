import { STAT_LABELS } from '../config'
import { COUNTRIES } from '../engine/calculate'
import type { CalcInput, CalcResult, StatKey } from '../engine/types'

/** ?debug=1 일 때만 lazy import 되는 개발용 패널 */
interface Props {
  input: CalcInput | null
  results: CalcResult[]
  buffOn: boolean
  onBuffChange: (on: boolean) => void
}

const n = (v: number, d = 4) => (Number.isFinite(v) ? v.toFixed(d) : String(v))
const usd = (v: number) => `$${Math.round(v).toLocaleString('en-US')}`
const KEYS: StatKey[] = ['income', 'wealth', 'education']

export default function DebugPanel({ input, results, buffOn, onBuffChange }: Props) {
  return (
    <section className="panel debug-panel">
      <div className="debug-head">
        <strong>DEBUG</strong>
        <label className="check">
          <input type="checkbox" checked={buffOn} onChange={(e) => onBuffChange(e.target.checked)} />
          버프 적용
        </label>
      </div>
      {!input && <p>입력 대기 중</p>}
      {input && <pre className="debug-input">{JSON.stringify(input, null, 1)}</pre>}
      {results.map((r) => (
        <table key={r.country} className="debug-table">
          <caption>
            {COUNTRIES[r.country].name} ({r.country})
          </caption>
          <tbody>
            <tr><th>buff</th><td>{r.trace.buff}</td></tr>
            <tr><th>f (환산 계수)</th><td>{n(r.trace.f)}</td></tr>
            <tr><th>소득 USD → ×f</th><td>{usd(r.trace.incomeUsd)} → {usd(r.trace.incomeUsd * r.trace.f)}</td></tr>
            <tr><th>자산 USD → ×f</th><td>{usd(r.trace.wealthUsd)} → {usd(r.trace.wealthUsd * r.trace.f)}</td></tr>
            <tr><th>중위 소득 / σ</th><td>{usd(r.trace.medianIncome)} / {n(r.trace.incomeSigma)}</td></tr>
            <tr><th>중위 자산 / σ</th><td>{usd(r.trace.medianWealth)} / {n(r.trace.wealthSigma)}</td></tr>
            {KEYS.map((k) => (
              <tr key={k}>
                <th>{STAT_LABELS[k]}{r.stats[k].locked ? ' 🔒' : ''}</th>
                <td>p {n(r.stats[k].rawP)} · z {n(r.stats[k].z, 3)} · p′ {n(r.stats[k].p)} · w {n(r.composite.weights[k] ?? 0, 3)}</td>
              </tr>
            ))}
            <tr><th>종합 z</th><td>{n(r.composite.baseZ)} + 레어도 {r.composite.rarityBonus} = {n(r.composite.z)}</td></tr>
            <tr><th>종합 p → p′</th><td>{n(r.composite.rawP)} → {n(r.composite.p)}</td></tr>
            <tr><th>레벨 / 티어</th><td>{r.composite.level} / {r.composite.tier}</td></tr>
          </tbody>
        </table>
      ))}
    </section>
  )
}
