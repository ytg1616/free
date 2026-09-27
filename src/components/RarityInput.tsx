import type { CSSProperties } from 'react'
import { RARITY_INFO, RARITY_ORDER } from '../config'
import type { Rarity } from '../engine/types'

interface Props {
  value: Rarity | null
  onChange: (value: Rarity | null) => void
}

/**
 * 직업 레어도 입력 (임시 선택형).
 * 입력 방식이 확정되면 이 컴포넌트만 교체한다 — value/onChange 계약만 유지하면 된다.
 */
export default function RarityInput({ value, onChange }: Props) {
  return (
    <div className="chips chips-4" role="radiogroup" aria-label="직업 레어도">
      {RARITY_ORDER.map((key) => {
        const selected = value === key
        return (
          <button
            key={key}
            type="button"
            role="radio"
            aria-checked={selected}
            className={`chip rarity-chip${selected ? ' is-selected' : ''}`}
            style={{ '--rarity': RARITY_INFO[key].color } as CSSProperties}
            // 한 번 더 누르면 선택 해제 (레어도는 선택 입력)
            onClick={() => onChange(selected ? null : key)}
          >
            {RARITY_INFO[key].label}
          </button>
        )
      })}
    </div>
  )
}
