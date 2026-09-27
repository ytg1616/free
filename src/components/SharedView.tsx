import type { ShareData } from '../share'
import ShareCard from './ShareCard'

/** 공유 링크로 들어온 사람이 보는 화면 */
export default function SharedView({ data, onStart }: { data: ShareData; onStart: () => void }) {
  return (
    <section className="shared-view" aria-label="공유받은 결과">
      <p className="shared-intro">공유받은 평행세계 레벨이에요</p>
      <ShareCard data={data} />
      <button type="button" className="btn btn-primary btn-cta" onClick={onStart}>
        나도 내 레벨 확인하기
      </button>
    </section>
  )
}
