import type { CSSProperties } from 'react'
import type { CompositeResult } from '../engine/types'
import { tierInfo, topPercent } from '../format'

export default function ResultCards({ composite }: { composite: CompositeResult }) {
  const tier = tierInfo(composite.tier)
  return (
    <div className="result-cards" style={{ '--tier': tier.color } as CSSProperties}>
      <div className="result-card">
        <div className="result-label">레벨</div>
        <div className="result-value">
          <span className="lv">Lv.</span>
          {composite.level}
        </div>
      </div>
      <div className="result-card is-tier">
        <div className="result-label">티어</div>
        <div className="result-value tier-name">{tier.name}</div>
      </div>
      <div className="result-card">
        <div className="result-label">상위</div>
        <div className="result-value">{topPercent(composite.p)}</div>
      </div>
    </div>
  )
}
