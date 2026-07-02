// @vitest-environment node
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const css = readFileSync(new URL('./App.css', import.meta.url), 'utf8')

function getRuleBody(selector: string): string {
  const escapedSelector = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const match = css.match(new RegExp(`${escapedSelector}\\s*\\{([\\s\\S]*?)\\n\\}`, 'm'))

  if (!match) {
    throw new Error(`${selector} rule not found`)
  }

  return match[1]
}

describe('App.css layout contracts', () => {
  it('makes the app shell full bleed instead of width capped', () => {
    const appShell = getRuleBody('.app-shell')

    expect(appShell).toContain('width: 100%;')
    expect(appShell).toContain('min-height: 100vh;')
    expect(appShell).not.toContain('width: min(')
  })

  it('includes responsive and reduced-motion rules for the refreshed UI', () => {
    expect(css).toContain('@media (max-width: 960px)')
    expect(css).toContain('@media (prefers-reduced-motion: reduce)')
  })
})
