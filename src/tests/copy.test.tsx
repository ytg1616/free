import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import App from '../App'
import InputPanel from '../components/InputPanel'
import ResultSection, { EmptyGuide } from '../components/ResultSection'
import { HOME_COUNTRY } from '../config'
import { calculate, COUNTRY_CODES } from '../engine/calculate'
import { initialForm, toCalcInput, type FormState } from '../form'

/** 평가·판정 표현과 숨은 보정의 흔적 */
const FORBIDDEN = /점수|순위|등수|하위|판정|버프|보정|buff/i

const filled: FormState = {
  ...initialForm,
  ageGroup: '30s',
  income: '3000',
  wealth: '5000',
  wealthNegative: true,
  education: 'bachelor',
  rarity: 'rare',
  rarityAffectsLevel: true,
}

function renderAll(form: FormState): string {
  const input = toCalcInput(form)!
  const result = calculate(input)
  const home = input.country !== HOME_COUNTRY ? calculate({ ...input, country: HOME_COUNTRY }) : null
  const noop = () => {}
  return [
    renderToStaticMarkup(<InputPanel form={form} onChange={noop} />),
    renderToStaticMarkup(<ResultSection form={form} result={result} homeResult={home} onChange={noop} />),
  ].join('\n')
}

describe('UI 문구', () => {
  it('첫 화면에 평가 표현이 없다', () => {
    const html = renderToStaticMarkup(<App />) + renderToStaticMarkup(<EmptyGuide missing={['학력']} />)
    expect(html).not.toMatch(FORBIDDEN)
  })

  it('모든 국가·환산 방식·소득 없음 조합의 결과 화면에 평가 표현이 없다', () => {
    for (const country of COUNTRY_CODES) {
      for (const mode of ['fx', 'ppp'] as const) {
        for (const noIncome of [false, true]) {
          const html = renderAll({ ...filled, country, mode, noIncome })
          expect(html).not.toMatch(FORBIDDEN)
          expect(html).toMatch(/\d+명 중에? .*\d+명/)
        }
      }
    }
  })
})

describe('프라이버시', () => {
  it('앱 코드에 저장소·네트워크 API가 없다', () => {
    const sources = import.meta.glob(['../**/*.{ts,tsx}', '!../tests/**'], {
      query: '?raw',
      import: 'default',
      eager: true,
    }) as Record<string, string>
    expect(Object.keys(sources).length).toBeGreaterThan(5)
    const banned = /localStorage|sessionStorage|indexedDB|document\.cookie|fetch\(|XMLHttpRequest|sendBeacon|WebSocket|EventSource/
    for (const [file, code] of Object.entries(sources)) {
      expect(code, file).not.toMatch(banned)
    }
  })
})
