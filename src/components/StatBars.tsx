import { STAT_LABELS } from '../config'
import type { CalcResult, StatKey } from '../engine/types'
import { topLabel } from '../format'

const ORDER: StatKey[] = ['income', 'wealth', 'education']

export default function StatBars({ result }: { result: CalcResult }) {
  return (
    <ul className="stat-bars" aria-label="스탯별 위치">
      {ORDER.map((key) => {
        const s = result.stats[key]
        const brightest = result.brightest === key
        return (
          <li key={key} className={`stat${s.locked ? ' is-locked' : ''}${brightest ? ' is-brightest' : ''}`}>
            <div className="stat-head">
              <span className="stat-name">
                {s.locked && (
                  <svg className="lock" viewBox="0 0 16 16" aria-hidden="true">
                    <path d="M4.5 7V5a3.5 3.5 0 0 1 7 0v2" fill="none" stroke="currentColor" strokeWidth="1.6" />
                    <rect x="3" y="7" width="10" height="7.5" rx="1.8" fill="currentColor" />
                  </svg>
                )}
                {STAT_LABELS[key]}
                {brightest && <span className="shine">✨ 가장 빛나는 스탯</span>}
              </span>
              <span className="stat-value">{s.locked ? '잠긴 스탯' : topLabel(s.p)}</span>
            </div>
            <div className="bar" aria-hidden="true">
              {!s.locked && <div className="bar-fill" style={{ width: `${s.p * 100}%` }} />}
            </div>
          </li>
        )
      })}
    </ul>
  )
}
