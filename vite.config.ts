import { configDefaults, defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    exclude: [...configDefaults.exclude, '**/.claude/worktrees/**'],
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    globals: true
  }
})
