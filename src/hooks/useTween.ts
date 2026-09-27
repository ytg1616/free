import { useEffect, useRef, useState } from 'react'

const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3)

function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
}

/**
 * target이 바뀌면 현재 값에서 target까지 부드럽게 이동한다.
 * SVG path의 d 속성은 iOS Safari에서 CSS 전환이 안 되므로 rAF로 값을 보간한다.
 */
export function useTween(target: number, duration = 700): number {
  const reduced = prefersReducedMotion()
  const [value, setValue] = useState(target)
  const current = useRef(target)

  useEffect(() => {
    const from = current.current
    if (reduced) current.current = target
    if (reduced || from === target) return
    const start = performance.now()
    let raf = requestAnimationFrame(function tick(now) {
      const t = Math.min(1, (now - start) / duration)
      const v = from + (target - from) * easeOutCubic(t)
      current.current = v
      setValue(v)
      if (t < 1) raf = requestAnimationFrame(tick)
    })
    return () => cancelAnimationFrame(raf)
  }, [target, duration, reduced])

  return reduced ? target : value
}
