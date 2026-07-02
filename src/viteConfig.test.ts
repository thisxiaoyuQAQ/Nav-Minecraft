// @vitest-environment node
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const viteConfig = readFileSync(new URL('../vite.config.ts', import.meta.url), 'utf8')

describe('Vite test configuration', () => {
  it('excludes generated Claude worktrees from full test discovery', () => {
    expect(viteConfig).toContain('exclude')
    expect(viteConfig).toContain('**/.claude/worktrees/**')
  })
})
