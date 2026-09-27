import type { CSSProperties } from 'react'
import { APP_TITLE, HOME_COUNTRY, MODES, STAT_LABELS } from '../config'
import { levelOf, tierOf } from '../engine/composite'
import { COUNTRIES } from '../engine/calculate'
import { flagOf, tierInfo, topRatio } from '../format'
import { groupLabel, type ShareData } from '../share'
import BellCurve from './BellCurve'
import RarityBadge from './RarityBadge'

/** 공유 링크로 전해지는 결과 카드 — 링크에 담긴 값만으로 그린다 */
export default function ShareCard({ data }: { data: ShareData }) {
  const tier = tierInfo(tierOf(data.p))
  const { total, count } = topRatio(data.p)
  const away = data.country !== HOME_COUNTRY
  const home = data.homeP !== null ? { level: levelOf(data.homeP), tier: tierInfo(tierOf(data.homeP)) } : null

  return (
    <article className="share-card" style={{ '--tier': tier.color } as CSSProperties}>
      <header className="share-card-head">
        <div>
          <div className="share-world">
            <span aria-hidden="true">{flagOf(data.country)}</span> {COUNTRIES[data.country].name}
            {away ? ' 평행세계' : '에서의 나'}
          </div>
          {away && <div className="share-mode">{MODES.find((m) => m.key === data.mode)?.hint}</div>}
        </div>
        {data.rarity && <RarityBadge rarity={data.rarity} />}
      </header>

      <div className="share-level">
        <span className="share-lv">
          <span className="lv">Lv.</span>
          {levelOf(data.p)}
        </span>
        <span className="share-tier">{tier.name}</span>
      </div>

      <p className="share-ratio">
        {groupLabel(data.group)} <strong>{total}명</strong> 중에 <strong className="ratio-count">{count}명</strong>{' '}
        안에 들어요
      </p>

      <BellCurve
        p={data.p}
        color={tier.color}
        baseline={
          data.homeP !== null
            ? { p: data.homeP, label: `${flagOf(HOME_COUNTRY)} ${COUNTRIES[HOME_COUNTRY].name}` }
            : null
        }
      />

      {(home || data.brightest) && (
        <ul className="share-facts">
          {home && (
            <li>
              <span aria-hidden="true">{flagOf(HOME_COUNTRY)}</span> {COUNTRIES[HOME_COUNTRY].name}에선{' '}
              <strong>
                Lv.{home.level} {home.tier.name}
              </strong>
            </li>
          )}
          {data.brightest && (
            <li>
              ✨ 가장 빛나는 스탯 <strong>{STAT_LABELS[data.brightest]}</strong>
            </li>
          )}
        </ul>
      )}

      <footer className="share-card-foot">{APP_TITLE}</footer>
    </article>
  )
}
