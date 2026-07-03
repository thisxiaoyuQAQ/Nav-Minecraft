import { execFileSync } from 'node:child_process'
import { configDefaults, defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

function getLastCommitDate(): string {
  try {
    return execFileSync('git', ['log', '-1', '--format=%cd', '--date=format:%Y-%m-%d'], {
      encoding: 'utf-8'
    }).trim()
  } catch {
    return ''
  }
}

export default defineConfig({
  plugins: [react()],
  define: {
    __LAST_COMMIT_DATE__: JSON.stringify(getLastCommitDate())
  },
  test: {
    exclude: [...configDefaults.exclude, '**/.claude/worktrees/**'],
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    globals: true
  }
})
