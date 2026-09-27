import { MODES } from '../config'
import { COUNTRIES, COUNTRY_CODES } from '../engine/calculate'
import type { ConversionMode, CountryCode } from '../engine/types'
import { flagOf } from '../format'

interface Props {
  country: CountryCode
  mode: ConversionMode
  onCountry: (country: CountryCode) => void
  onMode: (mode: ConversionMode) => void
}

export default function CountryPicker({ country, mode, onCountry, onMode }: Props) {
  return (
    <div className="country-picker">
      <div className="countries" role="radiogroup" aria-label="기준 국가">
        {COUNTRY_CODES.map((code) => (
          <button
            key={code}
            type="button"
            role="radio"
            aria-checked={country === code}
            className={`country${country === code ? ' is-selected' : ''}`}
            onClick={() => onCountry(code)}
          >
            <span className="flag" aria-hidden="true">
              {flagOf(code)}
            </span>
            <span className="country-name">{COUNTRIES[code].name}</span>
          </button>
        ))}
      </div>
      <div className="modes" role="radiogroup" aria-label="환산 방식">
        {MODES.map((m) => (
          <button
            key={m.key}
            type="button"
            role="radio"
            aria-checked={mode === m.key}
            className={`mode${mode === m.key ? ' is-selected' : ''}`}
            onClick={() => onMode(m.key)}
          >
            <strong>{m.label}</strong>
            <span>{m.hint}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
