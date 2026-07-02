# MCNAV Full-Bleed Apple Minecraft UI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Update the existing MCNAV page so the layout fills the full browser while using Apple-led glass UI with refined low-saturation Minecraft green gradients and restrained pixel accents in both light and dark modes.

**Architecture:** Keep the current React component and data architecture intact. Add CSS-focused visual contract tests, then update `src/App.css` and only minimally adjust `src/App.tsx` if extra decorative hooks are needed. No data, search, theme, or favicon logic changes are required.

**Tech Stack:** Vite, React, TypeScript, Vitest, Testing Library, CSS variables, CSS gradients, responsive CSS.

## Global Constraints

- Do not modify `wwwroot/`.
- Do not change Markdown data structure or `content/categories/*.md`.
- Do not change search logic, theme state logic, or favicon fallback logic.
- Do not introduce UI libraries, animation libraries, backend code, login, admin, or online editing.
- Desktop layout must fill the browser width and height; do not keep `width: min(1440px, 100%)` on `.app-shell`.
- Light mode must use warm glass and low-saturation mineral greens: `#FBFCFA`, `#EEF4EF`, `#6F8F68`, `#9DBB83`, `#4F7658`, `#1F2D22`, `#657264`.
- Dark mode must use deep spruce and muted emerald tones: `#071109`, `#122015`, `#152418`, `#8CAD78`, `#F4FAF2`, `#AEBDAE`.
- Minecraft styling must remain restrained: pixel accents and square-grid texture are decorative, not the dominant card style.
- Verify with `npm run test -- --run` and `npm run build`.
- Do not commit unless the user explicitly asks for commits.

---

## File Structure

- Modify: `src/App.css` — primary implementation file for full-bleed layout, light/dark palettes, glass panels, gradients, and pixel accents.
- Modify: `src/App.tsx` — only if needed to add a non-semantic decorative wrapper/class; avoid changing behavior.
- Create: `src/visualStyle.test.ts` — CSS contract tests for full-bleed layout, approved color tokens, dark-mode tokens, and removed pure-green old palette.
- Test existing: `src/App.test.tsx` — should continue passing without behavior changes.

---

### Task 1: Add visual contract tests

**Files:**
- Create: `src/visualStyle.test.ts`

**Interfaces:**
- Consumes: `src/App.css` as the visual source of truth.
- Produces: CSS-level tests that fail against the current centered layout and pure-green palette, then pass after Task 2.

- [ ] **Step 1: Write the failing visual style test file**

Create `src/visualStyle.test.ts` with this exact content:

```ts
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const css = readFileSync(new URL('./App.css', import.meta.url), 'utf8')

describe('MCNAV visual style contract', () => {
  it('uses a full-bleed app shell instead of a centered max-width page', () => {
    expect(css).not.toContain('width: min(1440px, 100%)')
    expect(css).toMatch(/\.app-shell\s*\{[\s\S]*width:\s*100%;[\s\S]*\}/)
    expect(css).toMatch(/\.app-shell\s*\{[\s\S]*min-height:\s*100vh;/)
    expect(css).toContain('padding: clamp(16px, 2vw, 32px);')
  })

  it('uses the approved low-saturation mineral green light palette', () => {
    for (const token of ['#FBFCFA', '#EEF4EF', '#6F8F68', '#9DBB83', '#4F7658', '#1F2D22', '#657264']) {
      expect(css.toUpperCase()).toContain(token)
    }

    expect(css.toLowerCase()).not.toContain('#32a852')
    expect(css.toLowerCase()).not.toContain('#22863a')
    expect(css.toLowerCase()).not.toContain('#54d66f')
  })

  it('uses the approved deep spruce dark palette without neon green', () => {
    for (const token of ['#071109', '#122015', '#152418', '#8CAD78', '#F4FAF2', '#AEBDAE']) {
      expect(css.toUpperCase()).toContain(token)
    }

    expect(css.toLowerCase()).not.toContain('#7af08f')
  })

  it('keeps Minecraft accents decorative instead of turning cards into hard pixel blocks', () => {
    expect(css).toContain('--pixel-accent-opacity')
    expect(css).toContain('mask: linear-gradient(135deg, #000, transparent 78%)')
    expect(css).toMatch(/\.nav-card\s*\{[\s\S]*border-radius:\s*26px;/)
  })
})
```

- [ ] **Step 2: Run the new test to verify it fails for the expected reasons**

Run:

```bash
npm run test -- --run src/visualStyle.test.ts
```

Expected: FAIL. The failure should mention the current centered shell (`width: min(1440px, 100%)`) and/or missing approved palette tokens.

---

### Task 2: Implement the full-bleed Apple + Minecraft visual layer

**Files:**
- Modify: `src/App.css`
- Test: `src/visualStyle.test.ts`
- Regression test: `src/App.test.tsx`

**Interfaces:**
- Consumes: current class names from `src/App.tsx`: `.app-shell`, `.sidebar`, `.brand-icon`, `.sidebar-nav`, `.topbar`, `.theme-toggle`, `.hero`, `.hero-pattern`, `.search-panel`, `.search-box`, `.category-section`, `.nav-card`, `.link-icon`.
- Produces: full-width responsive layout and approved light/dark visual tokens without changing component behavior.

- [ ] **Step 1: Replace the root CSS variables and global background**

In `src/App.css`, replace lines 1-55 with this exact block:

```css
:root {
  color-scheme: light;
  font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  background: #FBFCFA;
  color: #1F2D22;
  --bg: #FBFCFA;
  --bg-mid: #EEF4EF;
  --bg-deep: #DBE9DF;
  --panel: rgba(255, 255, 255, 0.62);
  --panel-strong: rgba(255, 255, 255, 0.74);
  --text: #1F2D22;
  --muted: #657264;
  --line: rgba(120, 137, 126, 0.22);
  --line-soft: rgba(120, 137, 126, 0.14);
  --accent: #6F8F68;
  --accent-2: #9DBB83;
  --accent-deep: #4F7658;
  --accent-soft: rgba(111, 143, 104, 0.14);
  --pixel-accent-opacity: 0.18;
  --shadow: 0 26px 90px rgba(34, 52, 39, 0.12);
  --card-shadow: 0 18px 55px rgba(36, 55, 42, 0.08);
}

:root[data-theme='dark'] {
  color-scheme: dark;
  background: #071109;
  color: #F4FAF2;
  --bg: #071109;
  --bg-mid: #101A12;
  --bg-deep: #182718;
  --panel: rgba(18, 32, 21, 0.62);
  --panel-strong: rgba(21, 36, 24, 0.72);
  --text: #F4FAF2;
  --muted: #AEBDAE;
  --line: rgba(188, 222, 193, 0.14);
  --line-soft: rgba(188, 222, 193, 0.1);
  --accent: #8CAD78;
  --accent-2: #A7C68D;
  --accent-deep: #4F7658;
  --accent-soft: rgba(140, 173, 120, 0.16);
  --pixel-accent-opacity: 0.2;
  --shadow: 0 30px 95px rgba(0, 0, 0, 0.38);
  --card-shadow: 0 20px 58px rgba(0, 0, 0, 0.2);
}

* {
  box-sizing: border-box;
}

html {
  min-width: 320px;
  min-height: 100%;
  scroll-behavior: smooth;
}

body {
  margin: 0;
  min-width: 320px;
  min-height: 100vh;
  background:
    radial-gradient(circle at 86% 10%, var(--accent-soft), transparent 34rem),
    linear-gradient(135deg, var(--bg) 0%, var(--bg-mid) 46%, var(--bg-deep) 100%);
  color: var(--text);
}

body::before {
  position: fixed;
  inset: 0;
  z-index: -1;
  pointer-events: none;
  content: '';
  background-image:
    linear-gradient(90deg, color-mix(in srgb, var(--accent) 16%, transparent) 1px, transparent 1px),
    linear-gradient(color-mix(in srgb, var(--accent) 16%, transparent) 1px, transparent 1px);
  background-size: 36px 36px;
  mask-image: linear-gradient(135deg, rgba(0, 0, 0, 0.45), transparent 62%);
  opacity: var(--pixel-accent-opacity);
}
```

- [ ] **Step 2: Replace the shell and sidebar layout rules**

In `src/App.css`, replace the existing `.app-shell` block and `.sidebar` block with this exact block:

```css
.app-shell {
  display: grid;
  grid-template-columns: 300px minmax(0, 1fr);
  gap: clamp(18px, 2vw, 32px);
  width: 100%;
  min-height: 100vh;
  margin: 0;
  padding: clamp(16px, 2vw, 32px);
}

.sidebar {
  position: sticky;
  top: clamp(16px, 2vw, 32px);
  height: calc(100vh - clamp(32px, 4vw, 64px));
  padding: 22px;
  overflow: auto;
  border: 1px solid var(--line);
  border-radius: 30px;
  background: var(--panel);
  box-shadow: var(--shadow);
  backdrop-filter: blur(26px);
}
```

- [ ] **Step 3: Replace brand and navigation accent colors**

In `src/App.css`, replace the `.brand-icon`, `.sidebar-nav a:hover`, and `.nav-count` blocks with this exact content:

```css
.brand-icon {
  display: grid;
  width: 48px;
  height: 48px;
  place-items: center;
  border-radius: 16px;
  background: linear-gradient(135deg, var(--accent), var(--accent-2) 52%, var(--accent-deep));
  color: #ffffff;
  font-weight: 900;
  box-shadow: 0 14px 34px color-mix(in srgb, var(--accent) 32%, transparent);
}

.sidebar-nav a:hover {
  border-color: var(--line);
  background: linear-gradient(135deg, var(--accent-soft), rgba(255, 255, 255, 0.18));
  color: var(--text);
}

.nav-count {
  color: var(--accent-deep);
  font-size: 0.78rem;
  font-weight: 700;
}

:root[data-theme='dark'] .nav-count {
  color: var(--accent-2);
}
```

- [ ] **Step 4: Replace shared panel, topbar, hero, and pixel accent rules**

In `src/App.css`, replace the existing `.topbar, .search-panel, .category-section, .hero`, `.topbar`, `.theme-toggle`, `.hero`, and `.hero-pattern` blocks with this exact content:

```css
.topbar,
.search-panel,
.category-section,
.hero {
  border: 1px solid var(--line);
  background: var(--panel);
  box-shadow: var(--card-shadow);
  backdrop-filter: blur(26px);
}

.topbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  margin-bottom: clamp(18px, 2vw, 28px);
  padding: 15px 22px;
  border-radius: 24px;
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
  cursor: pointer;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.08);
}

.hero {
  position: relative;
  overflow: hidden;
  padding: clamp(38px, 7vw, 92px);
  border-radius: 36px;
  background:
    radial-gradient(circle at 88% 12%, var(--accent-soft), transparent 34%),
    linear-gradient(135deg, var(--panel-strong), color-mix(in srgb, var(--panel) 72%, transparent));
}

.hero-pattern {
  position: absolute;
  inset: auto 36px 30px auto;
  width: 188px;
  height: 188px;
  opacity: var(--pixel-accent-opacity);
  background:
    linear-gradient(var(--accent-2) 0 0) 0 0 / 36px 36px,
    linear-gradient(var(--accent-deep) 0 0) 36px 36px / 36px 36px;
  mask: linear-gradient(135deg, #000, transparent 78%);
}
```

- [ ] **Step 5: Replace hero typography and search/card visual rules**

In `src/App.css`, update the existing matching blocks with this exact content:

```css
.eyebrow {
  margin: 0 0 16px;
  color: var(--accent-deep);
  font-size: 0.85rem;
  font-weight: 850;
  letter-spacing: 0.16em;
  text-transform: uppercase;
}

:root[data-theme='dark'] .eyebrow {
  color: var(--accent-2);
}

.hero h1 {
  max-width: 820px;
  margin: 0;
  font-size: clamp(2.8rem, 8vw, 6.8rem);
  line-height: 0.96;
  letter-spacing: -0.08em;
}

.hero-copy {
  max-width: 650px;
  margin: 22px 0 0;
  color: var(--muted);
  font-size: clamp(1rem, 2vw, 1.25rem);
  line-height: 1.8;
}

.hero-tags span {
  padding: 8px 12px;
  border: 1px solid var(--line);
  border-radius: 999px;
  background: linear-gradient(135deg, var(--accent-soft), color-mix(in srgb, var(--panel-strong) 68%, transparent));
  color: var(--accent-deep);
  font-weight: 750;
}

:root[data-theme='dark'] .hero-tags span {
  color: var(--accent-2);
}

.search-panel {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
  margin: clamp(18px, 2vw, 28px) 0;
  padding: 16px;
  border-radius: 24px;
}

.search-box {
  display: flex;
  flex: 1;
  align-items: center;
  gap: 12px;
  padding: 0 16px;
  border: 1px solid var(--line);
  border-radius: 22px;
  background: var(--panel-strong);
}

.category-section {
  scroll-margin-top: 24px;
  padding: clamp(20px, 2vw, 28px);
  border-radius: 30px;
}

.nav-card {
  display: flex;
  align-items: center;
  gap: 14px;
  min-height: 118px;
  padding: 16px;
  border: 1px solid var(--line-soft);
  border-radius: 26px;
  background: var(--panel-strong);
  text-decoration: none;
  transition: transform 180ms ease, border-color 180ms ease, box-shadow 180ms ease;
}

.nav-card:hover {
  transform: translateY(-3px);
  border-color: color-mix(in srgb, var(--accent) 36%, var(--line));
  box-shadow: 0 18px 44px color-mix(in srgb, var(--accent) 16%, transparent);
}
```

- [ ] **Step 6: Keep responsive full-width behavior**

Replace the current `@media (max-width: 960px)` block with this exact content:

```css
@media (max-width: 960px) {
  .app-shell {
    grid-template-columns: 1fr;
    padding: clamp(12px, 3vw, 20px);
  }

  .sidebar {
    position: static;
    height: auto;
    border-radius: 26px;
  }

  .sidebar-nav {
    grid-auto-flow: column;
    grid-auto-columns: max-content;
    overflow-x: auto;
    padding-bottom: 4px;
  }

  .sidebar-nav a {
    grid-template-columns: auto auto auto;
  }
}
```

- [ ] **Step 7: Run the visual style tests to verify they pass**

Run:

```bash
npm run test -- --run src/visualStyle.test.ts
```

Expected: PASS.

- [ ] **Step 8: Run app behavior regression tests**

Run:

```bash
npm run test -- --run src/App.test.tsx
```

Expected: PASS. The existing behavior tests should still verify MCNAV branding, no old admin entry, theme cycling, search, favicon, and fallback.

---

### Task 3: Final verification

**Files:**
- Test only; no intended file edits.

**Interfaces:**
- Consumes: all changes from Tasks 1-2.
- Produces: verified implementation ready for user review.

- [ ] **Step 1: Run the full test suite**

Run:

```bash
npm run test -- --run
```

Expected: PASS for all test files, including `src/visualStyle.test.ts`.

- [ ] **Step 2: Run the production build**

Run:

```bash
npm run build
```

Expected: PASS with Vite producing `dist/` assets.

- [ ] **Step 3: Optional visual smoke test**

Run:

```bash
npm run dev -- --host 127.0.0.1
```

Expected manual observations:

- Desktop width is filled; the page no longer appears as a centered narrow island.
- Light mode uses warm white glass and muted mineral green gradients, not pure green.
- Dark mode uses deep spruce/moss glass and muted emerald highlights, not black/neon green.
- Pixel accents are visible in the background/Hero but do not dominate cards or text.
- Search, theme toggle, category navigation, cards, favicons, and fallback icons still work.

## Self-Review

- Spec coverage: Tasks 1-2 cover full-bleed layout, light palette, dark palette, Apple glass panels, restrained pixel accents, and unchanged behavior boundaries. Task 3 covers the verification requirements.
- Placeholder scan: No `TBD`, `TODO`, or open-ended implementation placeholders remain.
- Type consistency: No TypeScript API changes are introduced. Existing `App.tsx` class names and behavior tests remain valid.
