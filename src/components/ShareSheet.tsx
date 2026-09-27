import { useEffect, useMemo, useState } from 'react'
import { APP_TITLE } from '../config'
import { levelOf, tierOf } from '../engine/composite'
import { COUNTRIES } from '../engine/calculate'
import { flagOf, tierInfo, topRatio } from '../format'
import { groupLabel, shareUrl, type ShareData } from '../share'
import ShareCard from './ShareCard'

interface Props {
  data: ShareData
  onClose: () => void
}

function shareText(d: ShareData): string {
  const { total, count } = topRatio(d.p)
  return (
    `${flagOf(d.country)} ${COUNTRIES[d.country].name} 평행세계에선 Lv.${levelOf(d.p)} ${tierInfo(tierOf(d.p)).name}! ` +
    `${groupLabel(d.group)} ${total}명 중에 ${count}명 안에 들어요`
  )
}

/** 공유 미리보기 + 링크 복사/공유 시트 */
export default function ShareSheet({ data, onClose }: Props) {
  const url = useMemo(() => shareUrl(data), [data])
  const [copied, setCopied] = useState(false)
  const canShare = typeof navigator !== 'undefined' && typeof navigator.share === 'function'

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prevOverflow
      window.removeEventListener('keydown', onKey)
    }
  }, [onClose])

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
    } catch {
      // 클립보드를 못 쓰면 아래 주소 칸을 선택해 둔다
      document.querySelector<HTMLInputElement>('.sheet-url')?.select()
    }
  }

  const share = async () => {
    try {
      await navigator.share({ title: APP_TITLE, text: shareText(data), url })
    } catch {
      // 사용자가 공유 창을 닫은 경우 — 아무것도 하지 않는다
    }
  }

  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <div
        className="sheet"
        role="dialog"
        aria-modal="true"
        aria-label="결과 공유"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sheet-head">
          <h2>결과 공유</h2>
          <button type="button" className="sheet-close" aria-label="닫기" onClick={onClose} autoFocus>
            ✕
          </button>
        </div>

        <ShareCard data={data} />

        <p className="sheet-note">🔒 입력한 금액과 학력은 링크에 담기지 않아요. 레벨과 비율만 전해져요.</p>

        <div className="sheet-actions">
          {canShare && (
            <button type="button" className="btn btn-primary" onClick={share}>
              공유하기
            </button>
          )}
          <button type="button" className={`btn${canShare ? '' : ' btn-primary'}`} onClick={copy}>
            {copied ? '복사했어요 ✓' : '링크 복사'}
          </button>
        </div>
        <input
          className="sheet-url"
          readOnly
          value={url}
          aria-label="공유 링크"
          onFocus={(e) => e.target.select()}
        />
      </div>
    </div>
  )
}
