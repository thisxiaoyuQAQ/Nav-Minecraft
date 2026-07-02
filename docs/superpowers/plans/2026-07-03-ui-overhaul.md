# MCNAV UI Overhaul Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the React homepage into a full-screen Apple Clean + Minecraft pixel-accent navigation dashboard without changing data loading or link behavior.

**Architecture:** Keep the current single-page React component structure and add only small semantic/decorative hooks in `App.tsx`; move the visual overhaul into `App.css`. Add tests for UI structure hooks and CSS layout contracts so the full-bleed shell, pixel accents, responsive rules, and reduced-motion support are protected.

**Tech Stack:** Vite, React, TypeScript, CSS variables, Vitest, Testing Library, jsdom.

## Global Constraints

- Only the new React homepage is in scope: `src/App.tsx`, `src/App.css`, and necessary tests.
- Do not modify `content/categories/*.md`, `src/navData.ts`, `src/parseMarkdownNav.ts`, `src/linkIcons.ts`, `src/theme.ts`, or `wwwroot/`.
- Do not add Tailwind, shadcn, animation libraries, routing, backend code, login, online editing, or drag-and-drop sorting.
- Preserve these behaviors: MCNAV branding, category anchors, local search, theme cycle, favicon fallback, external links, and removal of old TwoNav/admin entry points.
- Use Apple Clean as the dominant visual language and Minecraft pixel/grass-block accents as restrained decoration.
- Use white/green colors in both light and dark themes.
- Before claiming completion, run `npm run test -- --run` and `npm run build`.

---

## File Structure

- Modify: `src/App.test.tsx`
  - Adds a failing UI-structure test that requires the refreshed full-screen shell hooks, Hero pixel decoration hooks, topbar stat class, and search metadata class.
  - Keeps existing behavior tests for branding, search, theme, old-entry removal, favicon, and fallback.
- Modify: `src/App.tsx`
  - Adds `data-layout="full-bleed"` to `.app-shell`.
  - Adds class hooks in Topbar and SearchPanel.
  - Adds decorative `hero-glow` and `hero-block-field` elements in Hero.
  - Adds a `category-copy` class for CSS targeting.
  - Does not change data flow, filtering, theme, link, or favicon logic.
- Create: `src/AppCss.test.ts`
  - Reads `src/App.css` and checks critical CSS contracts that jsdom cannot visually verify.
- Modify: `src/App.css`
  - Replaces the current constrained layout with full-bleed white/green Apple glass styling and Minecraft pixel accents.
  - Adds responsive rules and reduced-motion handling.

---

### Task 1: Add React structure hooks for the refreshed UI

**Files:**
- Modify: `src/App.test.tsx`
- Modify: `src/App.tsx`

**Interfaces:**
- Consumes: `App({ initialCategories }: { initialCategories: NavCategory[] })`, `filterCategories(initialCategories, query)`, `ThemeToggle`, `LinkIcon`.
- Produces: Stable UI hooks used by CSS and tests:
  - `.app-shell[data-layout="full-bleed"]`
  - `.topbar-copy`
  - `.topbar-stat`
  - `.hero-glow`
  - `.hero-block-field`
  - fourteen `.hero-block` elements
  - `.search-meta`
  - `.category-copy`

- [ ] **Step 1: Write the failing structure test**

Add this test to `src/App.test.tsx` after the existing `renders MCNAV branding, Minecraft copy, search box, category heading, and cards` test:

```tsx
  it('renders full-screen UI structure hooks for the refreshed design', () => {
    const { container } = render(<App initialCategories={categories} />)

    expect(container.querySelector('.app-shell')).toHaveAttribute('data-layout', 'full-bleed')
    expect(container.querySelector('.topbar-copy')).toBeInTheDocument()
    expect(container.querySelector('.topbar-stat')).toHaveTextContent('1 个分类 · 3 个资源入口')
    expect(container.querySelector('.hero-glow')).toBeInTheDocument()
    expect(container.querySelector('.hero-block-field')).toBeInTheDocument()
    expect(container.querySelectorAll('.hero-block')).toHaveLength(14)
    expect(container.querySelector('.search-meta')).toHaveTextContent('共收录 3 个资源入口')
  })
```

- [ ] **Step 2: Run the targeted test and verify it fails**

Run:

```bash
npm run test -- --run src/App.test.tsx -t "renders full-screen UI structure hooks"
```

Expected: FAIL because the current `.app-shell` does not have `data-layout="full-bleed"`, and the current Hero does not render `.hero-glow`, `.hero-block-field`, or `.hero-block` elements.

- [ ] **Step 3: Replace `src/App.tsx` with the refreshed structure**

Replace the entire contents of `src/App.tsx` with:

```tsx
import { useEffect, useMemo, useState } from 'react'
import { getFallbackIconLabel, getFaviconUrl } from './linkIcons'
import { filterCategories } from './parseMarkdownNav'
import {
  applyTheme,
  getNextTheme,
  getStoredTheme,
  resolveTheme,
  saveTheme,
  type ThemeMode
} from './theme'
import type { NavCategory, NavLink } from './navTypes'
import './App.css'

interface AppProps {
  initialCategories: NavCategory[]
}

const themeLabels: Record<ThemeMode, string> = {
  system: '跟随系统',
  light: '白天',
  dark: '黑夜'
}

const themeIcons: Record<ThemeMode, string> = {
  system: '◐',
  light: '☀️',
  dark: '🌙'
}

const heroBlocks = Array.from({ length: 14 }, (_, index) => index)

export function App({ initialCategories }: AppProps) {
  const [query, setQuery] = useState('')
  const [themeMode, setThemeMode] = useState<ThemeMode>(() => {
    if (typeof window === 'undefined') {
      return 'system'
    }

    return getStoredTheme(window.localStorage) ?? 'system'
  })
  const [prefersDark, setPrefersDark] = useState(() => getPrefersDark())
  const visibleCategories = useMemo(() => filterCategories(initialCategories, query), [initialCategories, query])
  const totalLinks = initialCategories.reduce((sum, category) => sum + category.links.length, 0)
  const visibleLinks = visibleCategories.reduce((sum, category) => sum + category.links.length, 0)

  useEffect(() => {
    const mediaQuery = window.matchMedia?.('(prefers-color-scheme: dark)')

    if (!mediaQuery) {
      return undefined
    }

    const updatePreference = () => setPrefersDark(mediaQuery.matches)
    mediaQuery.addEventListener('change', updatePreference)

    return () => mediaQuery.removeEventListener('change', updatePreference)
  }, [])

  useEffect(() => {
    applyTheme(themeMode, resolveTheme(themeMode, prefersDark))
    saveTheme(window.localStorage, themeMode)
  }, [prefersDark, themeMode])

  return (
    <div className="app-shell" data-layout="full-bleed">
      <Sidebar categories={initialCategories} />

      <main className="main-content" id="top">
        <header className="topbar" role="banner">
          <div className="topbar-copy">
            <strong>MCNAV</strong>
            <span className="topbar-stat">{initialCategories.length} 个分类 · {totalLinks} 个资源入口</span>
          </div>
          <ThemeToggle themeMode={themeMode} onToggle={() => setThemeMode(getNextTheme(themeMode))} />
        </header>

        <Hero />
        <SearchPanel query={query} visibleLinks={visibleLinks} totalLinks={totalLinks} onQueryChange={setQuery} />

        <div className="category-stack" aria-live="polite">
          {visibleCategories.map((category) => (
            <CategorySection key={category.id} category={category} />
          ))}
        </div>
      </main>
    </div>
  )
}

function Sidebar({ categories }: { categories: NavCategory[] }) {
  return (
    <aside className="sidebar" aria-label="分类导航">
      <a className="brand-mark" href="#top" aria-label="MCNAV 首页">
        <span className="brand-icon" aria-hidden="true">M</span>
        <span className="brand-copy">
          <span className="brand-text">MCNAV</span>
          <span className="brand-subtitle">Minecraft Navigation</span>
        </span>
      </a>

      <nav className="sidebar-nav">
        {categories.map((category) => (
          <a key={category.id} href={`#category-${category.id}`}>
            <span className="nav-emoji" aria-hidden="true">{category.icon}</span>
            <span>{category.name}</span>
            <span className="nav-count">{category.links.length}</span>
          </a>
        ))}
      </nav>
    </aside>
  )
}

function Hero() {
  return (
    <section className="hero" aria-labelledby="hero-title">
      <div className="hero-glow" aria-hidden="true" />
      <div className="hero-pattern" aria-hidden="true" />
      <div className="hero-block-field" aria-hidden="true">
        {heroBlocks.map((block) => (
          <span className="hero-block" key={block} />
        ))}
      </div>
      <p className="eyebrow">Minecraft Navigation</p>
      <h1 id="hero-title">方块世界的高效入口</h1>
      <p className="hero-copy">收集服务端核心、插件 Wiki、开发文档、工具与社区资源。</p>
      <div className="hero-tags" aria-label="资源类型">
        <span>Server Core</span>
        <span>Plugin Wiki</span>
        <span>Dev Docs</span>
        <span>Tools</span>
      </div>
    </section>
  )
}

function SearchPanel({
  query,
  visibleLinks,
  totalLinks,
  onQueryChange
}: {
  query: string
  visibleLinks: number
  totalLinks: number
  onQueryChange: (query: string) => void
}) {
  return (
    <section className="search-panel" aria-label="资源搜索">
      <label className="search-box">
        <span aria-hidden="true">⌕</span>
        <input
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder="搜索核心、插件、Wiki、工具或服务器资源"
        />
      </label>
      <p className="search-meta">{query ? `找到 ${visibleLinks} / ${totalLinks} 个资源` : `共收录 ${totalLinks} 个资源入口`}</p>
    </section>
  )
}

function CategorySection({ category }: { category: NavCategory }) {
  return (
    <section className="category-section" id={`category-${category.id}`} aria-labelledby={`heading-${category.id}`}>
      <div className="category-heading">
        <span className="category-icon" aria-hidden="true">{category.icon}</span>
        <div className="category-copy">
          <h2 id={`heading-${category.id}`}>{category.name}</h2>
          <p>{category.description}</p>
        </div>
        <span className="category-total">{category.links.length}</span>
      </div>

      <div className="card-grid">
        {category.links.map((link) => (
          <NavCard key={`${category.id}-${link.title}-${link.url}`} link={link} categoryIcon={category.icon} />
        ))}
      </div>
    </section>
  )
}

function NavCard({ link, categoryIcon }: { link: NavLink; categoryIcon: string }) {
  return (
    <a className="nav-card" href={link.url} target="_blank" rel="noreferrer">
      <LinkIcon link={link} categoryIcon={categoryIcon} />
      <span className="card-content">
        <strong>{link.title}</strong>
        <span>{link.description}</span>
      </span>
      <span className="card-arrow" aria-hidden="true">↗</span>
    </a>
  )
}

function LinkIcon({ link, categoryIcon }: { link: NavLink; categoryIcon: string }) {
  const [failed, setFailed] = useState(false)
  const faviconUrl = link.icon ? undefined : getFaviconUrl(link.url)

  if (link.icon) {
    return <span className="link-icon manual" aria-hidden="true">{link.icon}</span>
  }

  if (faviconUrl && !failed) {
    return <img className="link-icon" src={faviconUrl} alt="" onError={() => setFailed(true)} />
  }

  return <span className="link-icon fallback" aria-hidden="true">{getFallbackIconLabel(link.title, categoryIcon)}</span>
}

function ThemeToggle({ themeMode, onToggle }: { themeMode: ThemeMode; onToggle: () => void }) {
  return (
    <button
      className="theme-toggle"
      type="button"
      onClick={onToggle}
      aria-label={`切换主题：当前${themeLabels[themeMode]}`}
    >
      <span aria-hidden="true">{themeIcons[themeMode]}</span>
      <span>{themeLabels[themeMode]}</span>
    </button>
  )
}

function getPrefersDark(): boolean {
  return typeof window !== 'undefined' && Boolean(window.matchMedia?.('(prefers-color-scheme: dark)').matches)
}
```

- [ ] **Step 4: Run the targeted structure test and verify it passes**

Run:

```bash
npm run test -- --run src/App.test.tsx -t "renders full-screen UI structure hooks"
```

Expected: PASS for the structure test.

- [ ] **Step 5: Run the full App test file**

Run:

```bash
npm run test -- --run src/App.test.tsx
```

Expected: PASS for all tests in `src/App.test.tsx`, including branding, old-entry removal, theme cycling, search filtering, favicon image rendering, and text-icon fallback.

- [ ] **Step 6: Commit Task 1**

Run:

```bash
git add src/App.test.tsx src/App.tsx
git commit -m "feat: add refreshed ui structure hooks" -m "Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

Expected: Git creates a commit containing only `src/App.test.tsx` and `src/App.tsx` changes.

---

### Task 2: Replace the visual system with full-screen Apple + Minecraft styling

**Files:**
- Create: `src/AppCss.test.ts`
- Modify: `src/App.css`

**Interfaces:**
- Consumes: CSS hooks produced by Task 1.
- Produces:
  - `.app-shell` full-bleed layout with `width: 100%;` and `min-height: 100vh;`
  - white/green CSS variables for light and dark themes
  - glass sidebar, topbar, Hero, search panel, category sections, and cards
  - Minecraft pixel accents in `.brand-icon`, `.hero-pattern`, `.hero-block-field`, and `.nav-card::after`
  - responsive rules for `max-width: 1100px`, `max-width: 960px`, and `max-width: 640px`
  - reduced-motion rule for `prefers-reduced-motion: reduce`

- [ ] **Step 1: Write the failing CSS contract test**

Create `src/AppCss.test.ts` with:

```ts
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
```

- [ ] **Step 2: Run the CSS contract test and verify it fails**

Run:

```bash
npm run test -- --run src/AppCss.test.ts
```

Expected: FAIL because the current `.app-shell` still contains `width: min(1440px, 100%);`, does not contain `width: 100%;`, and does not define a `prefers-reduced-motion` rule.

- [ ] **Step 3: Replace `src/App.css` with the refreshed visual system**

Replace the entire contents of `src/App.css` with:

```css
:root {
  color-scheme: light;
  font-family: ui-sans-serif, -apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", sans-serif;
  background: #f6fbf6;
  color: #162318;
  --bg: #f6fbf6;
  --bg-soft: #edf7ef;
  --panel: rgba(255, 255, 255, 0.72);
  --panel-strong: rgba(255, 255, 255, 0.9);
  --text: #162318;
  --muted: #657466;
  --line: rgba(37, 91, 48, 0.14);
  --line-strong: rgba(37, 91, 48, 0.24);
  --accent: #3bbf63;
  --accent-strong: #1f8d45;
  --accent-soft: rgba(59, 191, 99, 0.13);
  --accent-glow: rgba(59, 191, 99, 0.24);
  --shadow: 0 28px 90px rgba(27, 61, 36, 0.13);
  --card-shadow: 0 18px 55px rgba(27, 61, 36, 0.09);
  --inner-highlight: inset 0 1px 0 rgba(255, 255, 255, 0.74);
  --shell-padding: clamp(16px, 2vw, 32px);
}

:root[data-theme='dark'] {
  color-scheme: dark;
  background: #071109;
  color: #f2f8f1;
  --bg: #071109;
  --bg-soft: #101b12;
  --panel: rgba(18, 31, 21, 0.72);
  --panel-strong: rgba(20, 35, 23, 0.92);
  --text: #f2f8f1;
  --muted: #aab9aa;
  --line: rgba(190, 224, 196, 0.16);
  --line-strong: rgba(190, 224, 196, 0.26);
  --accent: #6ee083;
  --accent-strong: #9cf0a4;
  --accent-soft: rgba(110, 224, 131, 0.14);
  --accent-glow: rgba(110, 224, 131, 0.2);
  --shadow: 0 28px 90px rgba(0, 0, 0, 0.42);
  --card-shadow: 0 18px 55px rgba(0, 0, 0, 0.26);
  --inner-highlight: inset 0 1px 0 rgba(255, 255, 255, 0.08);
}

* {
  box-sizing: border-box;
}

html {
  scroll-behavior: smooth;
}

body {
  margin: 0;
  min-width: 320px;
  min-height: 100vh;
  overflow-x: hidden;
  background:
    radial-gradient(circle at 12% -8%, var(--accent-glow), transparent 34rem),
    radial-gradient(circle at 92% 10%, var(--accent-soft), transparent 30rem),
    linear-gradient(135deg, rgba(59, 191, 99, 0.07) 0 1px, transparent 1px 36px),
    linear-gradient(145deg, var(--bg), var(--bg-soft));
  background-size: auto, auto, 36px 36px, auto;
  color: var(--text);
}

body::before {
  position: fixed;
  inset: 0;
  z-index: -1;
  pointer-events: none;
  content: '';
  background:
    linear-gradient(90deg, transparent 0 31px, rgba(59, 191, 99, 0.06) 31px 32px, transparent 32px),
    linear-gradient(180deg, transparent 0 31px, rgba(59, 191, 99, 0.04) 31px 32px, transparent 32px);
  background-size: 64px 64px;
  mask-image: linear-gradient(120deg, rgba(0, 0, 0, 0.48), transparent 72%);
}

button,
input {
  font: inherit;
}

a {
  color: inherit;
}

.app-shell {
  position: relative;
  isolation: isolate;
  display: grid;
  grid-template-columns: 282px minmax(0, 1fr);
  gap: clamp(18px, 2vw, 30px);
  width: 100%;
  min-height: 100vh;
  padding: var(--shell-padding);
}

.sidebar {
  position: sticky;
  top: var(--shell-padding);
  height: calc(100vh - (var(--shell-padding) * 2));
  overflow: auto;
  padding: 20px;
  border: 1px solid var(--line);
  border-radius: 34px;
  background:
    linear-gradient(160deg, var(--panel-strong), var(--panel)),
    linear-gradient(135deg, rgba(59, 191, 99, 0.08), transparent 58%);
  box-shadow: var(--shadow), var(--inner-highlight);
  backdrop-filter: blur(28px) saturate(150%);
}

.sidebar::-webkit-scrollbar,
.sidebar-nav::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

.sidebar::-webkit-scrollbar-thumb,
.sidebar-nav::-webkit-scrollbar-thumb {
  border-radius: 999px;
  background: var(--line-strong);
}

.brand-mark {
  display: flex;
  align-items: center;
  gap: 13px;
  text-decoration: none;
}

.brand-icon {
  position: relative;
  display: grid;
  width: 52px;
  height: 52px;
  place-items: center;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.45);
  border-radius: 16px;
  background:
    linear-gradient(90deg, rgba(255, 255, 255, 0.18) 50%, transparent 50%) 0 0 / 14px 14px,
    linear-gradient(180deg, #78dc81 0 36%, #3bbf63 36% 64%, #1f8d45 64%);
  color: #ffffff;
  font-weight: 950;
  letter-spacing: -0.06em;
  box-shadow: inset 0 -8px 0 rgba(20, 88, 42, 0.2), 0 16px 32px rgba(59, 191, 99, 0.32);
  image-rendering: pixelated;
}

.brand-icon::after {
  position: absolute;
  inset: 8px 8px auto auto;
  width: 10px;
  height: 10px;
  content: '';
  background: rgba(255, 255, 255, 0.56);
  box-shadow: -14px 14px 0 rgba(255, 255, 255, 0.18);
}

.brand-copy {
  display: grid;
  gap: 3px;
}

.brand-text {
  font-size: 1.12rem;
  font-weight: 900;
  letter-spacing: 0.08em;
}

.brand-subtitle {
  color: var(--muted);
  font-size: 0.78rem;
}

.sidebar-nav {
  display: grid;
  gap: 8px;
  margin-top: 30px;
}

.sidebar-nav a {
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: 10px;
  padding: 11px 12px;
  border: 1px solid transparent;
  border-radius: 18px;
  color: var(--muted);
  text-decoration: none;
  transition: background 180ms ease, border-color 180ms ease, color 180ms ease, transform 180ms ease;
}

.sidebar-nav a:hover,
.sidebar-nav a:focus-visible {
  border-color: var(--line-strong);
  background: linear-gradient(135deg, var(--accent-soft), rgba(255, 255, 255, 0.08));
  color: var(--text);
  outline: 0;
  transform: translateX(2px);
}

.nav-emoji {
  display: grid;
  width: 28px;
  height: 28px;
  place-items: center;
  border-radius: 10px;
  background: var(--panel-strong);
  box-shadow: var(--inner-highlight);
}

.nav-count {
  min-width: 28px;
  padding: 3px 8px;
  border: 1px solid var(--line);
  border-radius: 999px;
  background: var(--accent-soft);
  color: var(--accent-strong);
  font-size: 0.76rem;
  font-weight: 800;
  text-align: center;
}

.main-content {
  display: grid;
  min-width: 0;
  align-content: start;
  gap: 24px;
}

.topbar,
.search-panel,
.category-section,
.hero {
  border: 1px solid var(--line);
  background: linear-gradient(145deg, var(--panel-strong), var(--panel));
  box-shadow: var(--card-shadow), var(--inner-highlight);
  backdrop-filter: blur(28px) saturate(150%);
}

.topbar {
  position: sticky;
  top: var(--shell-padding);
  z-index: 5;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  padding: 14px 18px;
  border-radius: 26px;
}

.topbar-copy {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 12px;
  align-items: baseline;
}

.topbar strong {
  letter-spacing: 0.09em;
}

.topbar-stat,
.search-meta,
.category-heading p,
.card-content span {
  color: var(--muted);
}

.theme-toggle {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  border: 1px solid var(--line);
  border-radius: 999px;
  background: var(--panel-strong);
  color: var(--text);
  box-shadow: var(--inner-highlight);
  cursor: pointer;
  transition: transform 180ms ease, border-color 180ms ease, background 180ms ease;
}

.theme-toggle:hover,
.theme-toggle:focus-visible {
  border-color: var(--line-strong);
  background: var(--accent-soft);
  outline: 3px solid color-mix(in srgb, var(--accent) 22%, transparent);
  transform: translateY(-1px);
}

.hero {
  position: relative;
  min-height: clamp(330px, 42vw, 520px);
  overflow: hidden;
  padding: clamp(34px, 7vw, 92px);
  border-radius: 40px;
}

.hero > :not(.hero-glow, .hero-pattern, .hero-block-field) {
  position: relative;
  z-index: 2;
}

.hero-glow {
  position: absolute;
  inset: -20% -10% auto auto;
  width: min(52vw, 680px);
  height: min(52vw, 680px);
  border-radius: 999px;
  background: radial-gradient(circle, var(--accent-glow), transparent 68%);
  filter: blur(8px);
}

.hero-pattern {
  position: absolute;
  inset: auto 34px 28px auto;
  width: min(28vw, 260px);
  height: min(28vw, 260px);
  opacity: 0.22;
  background:
    linear-gradient(var(--accent) 0 0) 0 0 / 34px 34px,
    linear-gradient(var(--accent-strong) 0 0) 34px 34px / 34px 34px;
  mask-image: linear-gradient(135deg, #000, transparent 74%);
}

.hero-block-field {
  position: absolute;
  right: clamp(20px, 7vw, 110px);
  bottom: clamp(20px, 5vw, 64px);
  z-index: 1;
  display: grid;
  grid-template-columns: repeat(4, clamp(18px, 3vw, 34px));
  gap: clamp(5px, 1vw, 9px);
  transform: rotate(-7deg);
  opacity: 0.58;
  mask-image: linear-gradient(135deg, #000, transparent 88%);
}

.hero-block {
  aspect-ratio: 1;
  border-radius: 7px;
  background:
    linear-gradient(90deg, rgba(255, 255, 255, 0.22) 50%, transparent 50%) 0 0 / 10px 10px,
    linear-gradient(180deg, color-mix(in srgb, var(--accent) 72%, white), var(--accent-strong));
  box-shadow: inset 0 -5px 0 rgba(10, 70, 32, 0.16), 0 12px 22px rgba(35, 120, 58, 0.16);
}

.hero-block:nth-child(3n) {
  transform: translateY(12px);
  opacity: 0.74;
}

.hero-block:nth-child(4n) {
  transform: translateY(-10px);
  opacity: 0.46;
}

.eyebrow {
  margin: 0 0 16px;
  color: var(--accent-strong);
  font-size: 0.82rem;
  font-weight: 900;
  letter-spacing: 0.18em;
  text-transform: uppercase;
}

.hero h1 {
  max-width: 820px;
  margin: 0;
  font-size: clamp(2.8rem, 7.8vw, 7.4rem);
  line-height: 0.94;
  letter-spacing: -0.085em;
}

.hero-copy {
  max-width: 650px;
  margin: 24px 0 0;
  color: var(--muted);
  font-size: clamp(1rem, 1.7vw, 1.28rem);
  line-height: 1.85;
}

.hero-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 30px;
}

.hero-tags span {
  padding: 9px 13px;
  border: 1px solid var(--line);
  border-radius: 999px;
  background: color-mix(in srgb, var(--accent-soft) 74%, var(--panel-strong));
  color: var(--accent-strong);
  font-size: 0.88rem;
  font-weight: 800;
  box-shadow: var(--inner-highlight);
}

.search-panel {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
  padding: 16px;
  border-radius: 28px;
}

.search-box {
  display: flex;
  flex: 1;
  align-items: center;
  gap: 12px;
  min-width: 220px;
  padding: 0 16px;
  border: 1px solid var(--line);
  border-radius: 20px;
  background: var(--panel-strong);
  box-shadow: var(--inner-highlight);
  transition: border-color 180ms ease, box-shadow 180ms ease;
}

.search-box:focus-within {
  border-color: color-mix(in srgb, var(--accent) 58%, var(--line));
  box-shadow: 0 0 0 4px color-mix(in srgb, var(--accent) 18%, transparent), var(--inner-highlight);
}

.search-box input {
  width: 100%;
  min-width: 0;
  padding: 16px 0;
  border: 0;
  outline: 0;
  background: transparent;
  color: var(--text);
}

.search-meta {
  margin: 0;
  white-space: nowrap;
}

.category-stack {
  display: grid;
  gap: 24px;
}

.category-section {
  scroll-margin-top: calc(var(--shell-padding) + 78px);
  padding: clamp(18px, 2vw, 26px);
  border-radius: 32px;
}

.category-heading {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: center;
  gap: 14px;
  margin-bottom: 18px;
}

.category-icon,
.link-icon {
  display: grid;
  width: 48px;
  height: 48px;
  place-items: center;
  flex: 0 0 auto;
  border: 1px solid var(--line);
  border-radius: 16px;
  background:
    linear-gradient(135deg, var(--panel-strong), var(--panel)),
    linear-gradient(90deg, rgba(59, 191, 99, 0.12) 50%, transparent 50%) 0 0 / 16px 16px;
  box-shadow: var(--inner-highlight);
}

.category-copy {
  min-width: 0;
}

.category-heading h2 {
  margin: 0;
  font-size: clamp(1.25rem, 2vw, 1.58rem);
  letter-spacing: -0.03em;
}

.category-heading p {
  margin: 5px 0 0;
  line-height: 1.65;
}

.category-total {
  min-width: 42px;
  padding: 7px 11px;
  border: 1px solid var(--line);
  border-radius: 999px;
  background: var(--accent-soft);
  color: var(--accent-strong);
  font-weight: 900;
  text-align: center;
}

.card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 14px;
}

.nav-card {
  position: relative;
  display: flex;
  align-items: center;
  gap: 14px;
  min-height: 118px;
  overflow: hidden;
  padding: 16px;
  border: 1px solid var(--line);
  border-radius: 25px;
  background: linear-gradient(145deg, var(--panel-strong), var(--panel));
  box-shadow: var(--inner-highlight);
  text-decoration: none;
  transition: transform 180ms ease, border-color 180ms ease, box-shadow 180ms ease, background 180ms ease;
}

.nav-card::after {
  position: absolute;
  inset: auto 14px 12px auto;
  width: 42px;
  height: 18px;
  content: '';
  opacity: 0;
  background:
    linear-gradient(var(--accent) 0 0) 0 0 / 9px 9px,
    linear-gradient(var(--accent-strong) 0 0) 9px 9px / 9px 9px;
  transition: opacity 180ms ease, transform 180ms ease;
  mask-image: linear-gradient(90deg, #000, transparent);
}

.nav-card:hover,
.nav-card:focus-visible {
  transform: translateY(-3px);
  border-color: color-mix(in srgb, var(--accent) 42%, var(--line));
  box-shadow: 0 18px 42px rgba(50, 168, 82, 0.16), var(--inner-highlight);
  outline: 0;
}

.nav-card:hover::after,
.nav-card:focus-visible::after {
  opacity: 0.42;
  transform: translateX(-4px);
}

.link-icon {
  object-fit: contain;
  padding: 8px;
  font-weight: 900;
}

.link-icon.manual,
.link-icon.fallback {
  padding: 0;
  color: var(--accent-strong);
}

.card-content {
  display: grid;
  gap: 7px;
  min-width: 0;
}

.card-content strong {
  line-height: 1.3;
  letter-spacing: -0.01em;
}

.card-content span {
  display: -webkit-box;
  overflow: hidden;
  line-height: 1.58;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.card-arrow {
  position: relative;
  z-index: 1;
  margin-left: auto;
  color: var(--accent-strong);
  font-weight: 800;
}

@media (max-width: 1100px) {
  .app-shell {
    grid-template-columns: 238px minmax(0, 1fr);
  }

  .hero h1 {
    max-width: 720px;
  }
}

@media (max-width: 960px) {
  .app-shell {
    grid-template-columns: 1fr;
    padding: clamp(12px, 3vw, 22px);
  }

  .sidebar,
  .topbar {
    position: static;
  }

  .sidebar {
    height: auto;
    border-radius: 28px;
  }

  .sidebar-nav {
    grid-auto-flow: column;
    grid-auto-columns: max-content;
    overflow-x: auto;
    margin-top: 18px;
    padding-bottom: 4px;
  }

  .sidebar-nav a {
    grid-template-columns: auto auto auto;
  }

  .hero-block-field {
    opacity: 0.36;
  }
}

@media (max-width: 640px) {
  .topbar,
  .search-panel,
  .category-heading {
    align-items: stretch;
    grid-template-columns: 1fr;
    flex-direction: column;
  }

  .theme-toggle {
    justify-content: center;
  }

  .hero {
    min-height: 0;
    padding: 34px 22px;
    border-radius: 30px;
  }

  .hero h1 {
    font-size: clamp(2.45rem, 15vw, 4.2rem);
  }

  .hero-block-field,
  .hero-pattern {
    display: none;
  }

  .search-meta {
    white-space: normal;
  }

  .category-section {
    border-radius: 26px;
  }

  .category-total {
    justify-self: start;
  }

  .card-grid {
    grid-template-columns: 1fr;
  }

  .nav-card {
    min-height: 108px;
  }
}

@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    scroll-behavior: auto !important;
    transition-duration: 0.01ms !important;
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
  }

  .sidebar-nav a:hover,
  .sidebar-nav a:focus-visible,
  .theme-toggle:hover,
  .theme-toggle:focus-visible,
  .nav-card:hover,
  .nav-card:focus-visible {
    transform: none;
  }
}
```

- [ ] **Step 4: Run the CSS contract test and verify it passes**

Run:

```bash
npm run test -- --run src/AppCss.test.ts
```

Expected: PASS for both CSS contract tests.

- [ ] **Step 5: Run the App behavior tests to confirm the visual CSS did not require markup regressions**

Run:

```bash
npm run test -- --run src/App.test.tsx
```

Expected: PASS for all tests in `src/App.test.tsx`.

- [ ] **Step 6: Commit Task 2**

Run:

```bash
git add src/AppCss.test.ts src/App.css
git commit -m "style: apply full-screen apple minecraft ui" -m "Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

Expected: Git creates a commit containing only `src/AppCss.test.ts` and `src/App.css` changes.

---

### Task 3: Run final verification

**Files:**
- No file changes expected.

**Interfaces:**
- Consumes: completed Task 1 and Task 2 commits.
- Produces: verification evidence that tests and production build pass.

- [ ] **Step 1: Run the complete Vitest suite**

Run:

```bash
npm run test -- --run
```

Expected: PASS for every test file, including `src/App.test.tsx`, `src/AppCss.test.ts`, `src/contentCategories.test.ts`, `src/linkIcons.test.ts`, `src/parseMarkdownNav.test.ts`, and `src/theme.test.ts`.

- [ ] **Step 2: Run the production build**

Run:

```bash
npm run build
```

Expected: PASS. TypeScript emits no errors, and Vite writes the production bundle to `dist/`.

- [ ] **Step 3: Inspect the final diff against the branch base**

Run:

```bash
git status --short
git log --oneline -3
```

Expected: `git status --short` is clean after Task 1 and Task 2 commits. The latest commits include:

```text
style: apply full-screen apple minecraft ui
feat: add refreshed ui structure hooks
```

- [ ] **Step 4: Report completion with evidence**

Report these exact items to the user:

```text
Implemented the full-screen Apple Clean + Minecraft pixel-accent UI.
Verification passed:
- npm run test -- --run
- npm run build
```

If either command fails, do not claim completion. Keep the failed output, fix the issue with a new failing test first when the failure is behavioral, then rerun verification.

---

## Self-Review

### Spec coverage

- Full-screen layout: Task 2 CSS contract requires `.app-shell` to use `width: 100%;` and `min-height: 100vh;`.
- Apple Clean visual style: Task 2 replaces panels with glass backgrounds, soft borders, shadows, and large Hero typography.
- Minecraft pixel accents: Task 1 adds Hero block hooks; Task 2 styles the brand icon, Hero blocks, Hero pattern, and nav-card pixel highlight.
- White/green theme: Task 2 defines light and dark green CSS variables.
- New React homepage only: File structure limits changes to `src/App.tsx`, `src/App.css`, and tests.
- Existing behavior preservation: Task 1 and Task 2 both run `src/App.test.tsx`; Task 3 runs the full test suite and build.
- Responsive and reduced motion: Task 2 CSS contract checks `@media (max-width: 960px)` and `@media (prefers-reduced-motion: reduce)`.

### Placeholder scan

This plan contains no placeholder markers, no deferred implementation notes, and no unnamed files.

### Type and name consistency

The CSS/test hooks are consistent across tasks: `.app-shell`, `.topbar-copy`, `.topbar-stat`, `.hero-glow`, `.hero-block-field`, `.hero-block`, `.search-meta`, and `.category-copy`. The React component signatures remain unchanged: `App`, `Sidebar`, `Hero`, `SearchPanel`, `CategorySection`, `NavCard`, `LinkIcon`, and `ThemeToggle`.
