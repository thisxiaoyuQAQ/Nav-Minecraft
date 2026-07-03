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
  const queryParts = selector.split(',').map((part) => part.trim())
  const bodies = rules
    .filter((rule) => {
      const ruleParts = rule.selector.split(',').map((part) => part.trim())
      return queryParts.every((part) => ruleParts.includes(part))
    })
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

describe('design tokens', () => {
  it('defines the 5-level radius scale', () => {
    const [root] = getRuleBodies(':root')
    expect(root).toContain('--r-sm: 6px;')
    expect(root).toContain('--r-md: 10px;')
    expect(root).toContain('--r-lg: 14px;')
    expect(root).toContain('--r-xl: 18px;')
    expect(root).toContain('--r-full: 999px;')
  })

  it('defines two-level shadows and drops inner-highlight / card-shadow', () => {
    const [root] = getRuleBodies(':root')
    expect(root).toContain('--shadow-sm:')
    expect(root).toContain('--shadow-lg:')
    expect(root).not.toMatch(/--inner-highlight/)
    expect(root).not.toMatch(/--card-shadow/)
  })

  it('aliases dark accent to white with no green accent', () => {
    const [dark] = getRuleBodies(":root[data-theme='dark']")
    expect(dark).toContain('--accent: #ffffff;')
    expect(dark).not.toMatch(/--accent: #(?!ffffff)[0-9a-fA-F]{6}/)
  })

  it('uses AA-compliant light accent-strong', () => {
    const [root] = getRuleBodies(':root')
    expect(root).toContain('--accent-strong: #1d8242;')
  })
})

describe('decoration policy', () => {
  it('body has only the base gradient, no decorative layers', () => {
    const [body] = getRuleBodies('body')
    expect(body).not.toMatch(/radial-gradient/)
    expect(body).toContain('linear-gradient(145deg, var(--bg), var(--bg-soft))')
  })

  it('removes body::before second grid', () => {
    expect(() => getRuleBodies('body::before')).toThrow('body::before rule not found')
  })

  it('removes hero-pattern rule', () => {
    expect(() => getRuleBodies('.hero-pattern')).toThrow('.hero-pattern rule not found')
  })

  it('removes nav-card::after hover spot', () => {
    expect(() => getRuleBodies('.nav-card::after')).toThrow('.nav-card::after rule not found')
  })

  it('keeps hero-glow as a single radial glow', () => {
    const [glow] = getRuleBodies('.hero-glow')
    expect(glow).toContain('radial-gradient(circle, var(--accent-glow), transparent')
    expect(glow).toContain('border-radius: var(--r-full);')
  })
})

describe('component token usage', () => {
  it('uses only the 5 radius tokens across all rules', () => {
    const radiusValues = rules
      .map((r) => r.body.match(/border-radius:\s*([^;]+);/g) || [])
      .flat()
      .join('\n')
    expect(radiusValues).not.toMatch(/border-radius:\s*\d+px(?!\s*[,)])/)
    // 允许的硬编码仅 999px (full) — 其余必须 var(--r-*)
    const offenders = radiusValues
      .split('\n')
      .filter((l) => /border-radius:\s*\d+px/.test(l) && !/999px/.test(l) && !/var\(--r-/.test(l))
    expect(offenders).toEqual([])
  })

  it('applies backdrop-filter only to hero and topbar', () => {
    const withBlur = rules.filter((r) => /backdrop-filter/.test(r.body))
    const selectors = withBlur.map((r) => r.selector)
    expect(selectors).toContain('.hero')
    expect(selectors).toContain('.topbar')
    expect(withBlur.length).toBe(2)
  })

  it('icon tiles use neutral panel, not accent gradients', () => {
    const [navEmoji] = getRuleBodies('.nav-emoji')
    expect(navEmoji).toContain('background: var(--panel);')
    expect(navEmoji).not.toMatch(/accent/)

    const [categoryIcon] = getRuleBodies('.category-icon, .link-icon')
    expect(categoryIcon).toContain('var(--panel)')
  })

  it('nav-card uses md radius and sm shadow', () => {
    const [card] = getRuleBodies('.nav-card')
    expect(card).toContain('border-radius: var(--r-md);')
    expect(card).toContain('box-shadow: var(--shadow-sm);')
  })

  it('large containers use xl radius and lg shadow', () => {
    for (const sel of ['.hero', '.sidebar', '.category-section', '.post-page']) {
      const [body] = getRuleBodies(sel)
      expect(body).toContain('border-radius: var(--r-xl);')
      expect(body).toContain('box-shadow: var(--shadow-lg);')
    }
  })
})

describe('accessibility', () => {
  it('search-box focus uses accent-strong ring at AA', () => {
    const [focus] = getRuleBodies('.search-box:focus-within')
    expect(focus).toContain('border-color: var(--accent-strong)')
    expect(focus).toMatch(/outline:\s*2px solid var\(--accent-strong\)/)
  })

  it('interactive elements use outline 2px for focus', () => {
    const focusRules = rules.filter(
      (r) => /:focus-visible/.test(r.selector) && /outline:\s*2px/.test(r.body)
    )
    expect(focusRules.length).toBeGreaterThan(0)
  })
})
