// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { configDefaults } from 'vitest/config'

const viteConfigModule = await import(new URL('../vite.config.ts', import.meta.url).href)
const viteConfig = viteConfigModule.default

const resolvedConfig = typeof viteConfig === 'function' ? viteConfig({ command: 'serve', mode: 'test' }) : viteConfig
const testConfig = 'test' in resolvedConfig ? resolvedConfig.test : undefined

describe('Vite test configuration', () => {
  it('extends Vitest default excludes while skipping generated Claude worktrees', () => {
    expect(testConfig?.exclude).toEqual(expect.arrayContaining(configDefaults.exclude))
    expect(testConfig?.exclude).toContain('**/.claude/worktrees/**')
  })

  it('keeps default test discovery instead of narrowing include globs', () => {
    expect(testConfig?.include).toBeUndefined()
  })
})
