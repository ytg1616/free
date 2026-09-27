import { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react'
import InputPanel from './components/InputPanel'
import ResultSection, { EmptyGuide } from './components/ResultSection'
import SharedView from './components/SharedView'
import { APP_TITLE, BUFF, HOME_COUNTRY } from './config'
import { calculate } from './engine/calculate'
import { ratioLabel, tierInfo } from './format'
import { initialForm, missingFields, toCalcInput, type FormState } from './form'
import { decodeShare, type ShareData } from './share'

// ?debug=1 일 때만 불러온다 — 일반 화면에는 흔적을 남기지 않는다
const DebugPanel = lazy(() => import('./components/DebugPanel'))
const DEBUG =
  typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('debug') === '1'

function readShared(): ShareData | null {
  return typeof window === 'undefined' ? null : decodeShare(window.location.hash)
}

export default function App() {
  // 공유 링크(#v=1&...)로 들어오면 결과 카드부터 보여준다
  const [shared, setShared] = useState<ShareData | null>(readShared)
  useEffect(() => {
    const onHash = () => setShared(readShared())
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])
  const startOwn = () => {
    window.history.replaceState(null, '', window.location.pathname + window.location.search)
    setShared(null)
    window.scrollTo(0, 0)
  }

  const [form, setForm] = useState<FormState>(initialForm)
  const [buffOn, setBuffOn] = useState(true)
  const update = (patch: Partial<FormState>) => setForm((f) => ({ ...f, ...patch }))

  const input = useMemo(() => toCalcInput(form), [form])
  const buff = buffOn ? BUFF : 0
  const result = useMemo(() => (input ? calculate(input, { buff }) : null), [input, buff])
  const homeResult = useMemo(
    () =>
      input && input.country !== HOME_COUNTRY
        ? calculate({ ...input, country: HOME_COUNTRY }, { buff })
        : null,
    [input, buff],
  )

  // 모바일에서 결과가 화면 밖에 있으면 하단에 요약 바를 띄운다
  const resultRef = useRef<HTMLElement>(null)
  const [resultVisible, setResultVisible] = useState(true)
  const hasResult = result !== null
  useEffect(() => {
    const el = resultRef.current
    if (!el || typeof IntersectionObserver === 'undefined') return
    const io = new IntersectionObserver(([entry]) => setResultVisible(entry.isIntersecting), {
      rootMargin: '0px 0px -30% 0px',
    })
    io.observe(el)
    return () => io.disconnect()
  }, [hasResult])

  return (
    <div className="app">
      <header className="app-header">
        <h1>{APP_TITLE}</h1>
        <p>내 스탯은 어느 레벨쯤일까? 다른 나라에선 어떨까?</p>
      </header>

      {shared ? (
        <main className="shared-layout">
          <SharedView data={shared} onStart={startOwn} />
        </main>
      ) : (
        <main className="layout">
          <InputPanel form={form} onChange={update} />
          {result ? (
            <ResultSection ref={resultRef} form={form} result={result} homeResult={homeResult} onChange={update} />
          ) : (
            <EmptyGuide missing={missingFields(form)} />
          )}
        </main>
      )}

      {DEBUG && (
        <Suspense fallback={null}>
          <DebugPanel
            input={input}
            results={[result, homeResult].filter((r) => r !== null)}
            buffOn={buffOn}
            onBuffChange={setBuffOn}
          />
        </Suspense>
      )}

      <footer className="disclaimer">재미를 위한 추정치예요. 실제 통계와 다를 수 있어요.</footer>

      {!shared && result && !resultVisible && (
        <button
          type="button"
          className="level-hud"
          style={{ borderColor: tierInfo(result.composite.tier).color }}
          onClick={() => resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
        >
          <span>
            <strong>Lv.{result.composite.level}</strong> {tierInfo(result.composite.tier).name} ·{' '}
            {ratioLabel(result.composite.p)}
          </span>
          <span className="hud-cta">결과 보기 ↓</span>
        </button>
      )}
    </div>
  )
}
