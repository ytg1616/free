import type { CSSProperties } from 'react'
import type { CompositeResult } from '../engine/types'
import { tierInfo, topRatio } from '../format'

interface Props {
  composite: CompositeResult
  /** 비교 집단 이름 — "30대", "전체 성인" */
  group: string
}

export default function ResultCards({ composite, group }: Props) {
  const tier = tierInfo(composite.tier)
  const { total, count } = topRatio(composite.p)
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
      <p className="result-card ratio-card">
        {group} <strong>{total}명</strong> 중에 <strong className="ratio-count">{count}명</strong> 안에
        들어요
      </p>
    </div>
  )
}
