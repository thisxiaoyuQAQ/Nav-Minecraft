import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    exclude: ['**/node_modules/**', '**/dist/**', '**/.claude/worktrees/**'],
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    globals: true
  }
})
