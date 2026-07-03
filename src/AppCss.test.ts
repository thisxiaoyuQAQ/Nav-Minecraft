// @vitest-environment node
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const css = readFileSync(new URL('./App.css', import.meta.url), { encoding: 'utf8' })

type CssRule = {
  selector: string
  body: string
}

function parseCssRules(source: string): CssRule[] {
  const rules: CssRule[] = []

  function collectRules(block: string): void {
    let index = 0

    while (index < block.length) {
      const openBrace = block.indexOf('{', index)

      if (openBrace === -1) {
        break
      }

      const selector = block.slice(index, openBrace).trim()
      let depth = 1
      let cursor = openBrace + 1

      while (cursor < block.length && depth > 0) {
        const char = block[cursor]

        if (char === '{') {
          depth += 1
        } else if (char === '}') {
          depth -= 1
        }

        cursor += 1
      }

      if (depth !== 0) {
        throw new Error(`Unclosed CSS rule starting at: ${selector}`)
      }

      const body = block.slice(openBrace + 1, cursor - 1)

      if (selector.startsWith('@')) {
        collectRules(body)
      } else if (selector) {
        rules.push({ selector, body })
      }

      index = cursor
    }
  }

  collectRules(source)

  return rules
}

const rules = parseCssRules(css)

function getRuleBodies(selector: string): string[] {
  const bodies = rules
    .filter((rule) => rule.selector.split(',').map((part) => part.trim()).includes(selector))
    .map((rule) => rule.body)

  if (bodies.length === 0) {
    throw new Error(`${selector} rule not found`)
  }

  return bodies
}

describe('App.css layout contracts', () => {
  it('makes the base app shell full bleed instead of width capped', () => {
    const [baseAppShell] = getRuleBodies('.app-shell')

    expect(baseAppShell).toContain('width: 100%;')
    expect(baseAppShell).toContain('min-height: 100vh;')
  })

  it('does not reintroduce app shell width caps in any rule block', () => {
    const appShellRules = getRuleBodies('.app-shell')

    for (const ruleBody of appShellRules) {
      expect(ruleBody).not.toMatch(/(?:^|;)\s*max-width\s*:/i)
      expect(ruleBody).not.toMatch(/(?:^|;)\s*width\s*:\s*(?:min\(|clamp\(|\d+(?:\.\d+)?(?:px|rem|vw))/i)
    }
  })

  it('includes responsive and reduced-motion rules for the refreshed UI', () => {
    expect(css).toContain('@media (max-width: 960px)')
    expect(css).toContain('@media (prefers-reduced-motion: reduce)')
  })

  it('defines non-blocking hover and focus tooltip styles for nav cards', () => {
    const [tooltipBase] = getRuleBodies('.card-tooltip')
    const [tooltipHover] = getRuleBodies('.nav-card:hover .card-tooltip')
    const [tooltipFocus] = getRuleBodies('.nav-card:focus-visible .card-tooltip')
    const cardDescriptionRules = getRuleBodies('.card-content span')

    expect(tooltipBase).toContain('position: absolute;')
    expect(tooltipBase).toContain('pointer-events: none;')
    expect(tooltipBase).toContain('opacity: 0;')
    expect(tooltipBase).toContain('visibility: hidden;')
    expect(tooltipHover).toContain('opacity: 1;')
    expect(tooltipHover).toContain('visibility: visible;')
    expect(tooltipFocus).toContain('opacity: 1;')
    expect(tooltipFocus).toContain('visibility: visible;')
    expect(cardDescriptionRules.some((ruleBody) => ruleBody.includes('-webkit-line-clamp: 2;'))).toBe(true)
  })

  it('lets nav card tooltips escape the card bounds', () => {
    const [navCard] = getRuleBodies('.nav-card')

    expect(navCard).toContain('overflow: visible;')
  })
})
