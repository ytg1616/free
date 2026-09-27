import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [react()],
  // GitHub Pages 하위 경로(/free/)에서도 동작하도록 상대 경로로 빌드
  base: './',
  test: {
    include: ['src/tests/**/*.test.ts'],
  },
})
