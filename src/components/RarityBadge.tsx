import type { CSSProperties } from 'react'
import { RARITY_INFO } from '../config'
import type { Rarity } from '../engine/types'

/** 게임 아이템 등급처럼 색으로 구분하는 레어도 뱃지 */
export default function RarityBadge({ rarity }: { rarity: Rarity }) {
  const info = RARITY_INFO[rarity]
  return (
    <span className={`rarity-badge rarity-${rarity}`} style={{ '--rarity': info.color } as CSSProperties}>
      <span className="gem" aria-hidden="true" />
      직업 레어도 · {info.label}
    </span>
  )
}
