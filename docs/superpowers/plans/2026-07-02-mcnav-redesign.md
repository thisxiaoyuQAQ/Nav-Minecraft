# MCNAV Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign the existing React Markdown navigation page into MCNAV with Apple Clean + Minecraft Accent styling, day/night mode, reliable icons, and cleaned Minecraft-specific Markdown descriptions.

**Architecture:** Keep the current Vite + React + TypeScript + Markdown/YAML data flow. Add focused helpers for theme persistence and icon source/fallback behavior, then update `App.tsx` to use them while preserving search/category rendering. Update CSS through theme variables and clean active Markdown content without changing the content loader.

**Tech Stack:** Vite, React, TypeScript, Vitest, Testing Library, YAML, CSS variables, `localStorage`, `prefers-color-scheme`.

## Global Constraints

- Rename all visible frontend branding from TwoNav/TwoNav React to MCNAV.
- Use the approved **Apple Clean + Minecraft Accent** visual direction.
- Add day and night modes with a visible theme toggle.
- Default theme follows `prefers-color-scheme`; explicit user choice is saved to `localStorage`.
- Remove the top-right `管理记录` link.
- Make link icons display with priority: manual `link.icon`, generated favicon, visible fallback.
- Keep records editable as Markdown/YAML in `content/categories/`.
- Do not add a backend, database, admin panel, UI library, or framework migration.
- Rewrite active `content/categories/*.md` descriptions; do not edit `.md.del` files as active content.
- Keep search behavior and category anchor navigation.
- Final verification commands: `npm run test -- --run` and `npm run build`.

---

## File Structure

- Modify: `src/App.tsx` — main page composition, MCNAV copy, theme state wiring, link card icon fallback UI.
- Modify: `src/App.css` — Apple/Minecraft visual system, day/night CSS variables, responsive layout, cards, theme toggle.
- Create: `src/theme.ts` — pure theme helpers for system/default theme, storage-safe persistence, and root `data-theme` updates.
- Create: `src/linkIcons.ts` — pure icon helpers for title fallback and favicon URL generation.
- Modify: `src/App.test.tsx` — app behavior tests for MCNAV copy, removed management link, theme toggle, search, and icon fallback.
- Create: `src/linkIcons.test.ts` — unit tests for favicon URL and fallback mark helpers.
- Create: `src/theme.test.ts` — unit tests for storage-safe theme helpers.
- Modify: `src/contentCategories.test.ts` — content quality tests that reject TwoNav import boilerplate and repeated category descriptions.
- Modify: `content/categories/*.md` — active Markdown descriptions and body cleanup.

---

### Task 1: Add focused theme and icon helper tests

**Files:**
- Create: `src/theme.test.ts`
- Create: `src/linkIcons.test.ts`

**Interfaces:**
- Produces for Task 2:
  - `type ThemeMode = 'day' | 'night'`
  - `getStoredTheme(storage: Storage): ThemeMode | null`
  - `saveTheme(storage: Storage, theme: ThemeMode): void`
  - `resolveInitialTheme(options: { storage?: Storage; prefersDark?: boolean }): ThemeMode`
  - `applyTheme(theme: ThemeMode, root?: HTMLElement): void`
  - `getFaviconUrl(url: string): string | undefined`
  - `getFallbackIconLabel(title: string): string`

- [ ] **Step 1: Create the failing theme helper tests**

Create `src/theme.test.ts` with this content:

```ts
import { describe, expect, it, vi } from 'vitest';
import { applyTheme, getStoredTheme, resolveInitialTheme, saveTheme } from './theme';

describe('theme helpers', () => {
  it('reads only supported stored theme values', () => {
    const storage = makeStorage({ mcnavTheme: 'night' });

    expect(getStoredTheme(storage)).toBe('night');

    storage.setItem('mcnavTheme', 'blue');
    expect(getStoredTheme(storage)).toBeNull();
  });

  it('falls back to system preference when no supported stored theme exists', () => {
    expect(resolveInitialTheme({ storage: makeStorage(), prefersDark: true })).toBe('night');
    expect(resolveInitialTheme({ storage: makeStorage(), prefersDark: false })).toBe('day');
  });

  it('prefers a stored theme over system preference', () => {
    expect(resolveInitialTheme({ storage: makeStorage({ mcnavTheme: 'day' }), prefersDark: true })).toBe('day');
  });

  it('saves the selected theme when storage is available', () => {
    const storage = makeStorage();

    saveTheme(storage, 'night');

    expect(storage.getItem('mcnavTheme')).toBe('night');
  });

  it('ignores storage errors so theme switching still works in the current session', () => {
    const storage = {
      getItem: vi.fn(() => { throw new Error('blocked'); }),
      setItem: vi.fn(() => { throw new Error('blocked'); }),
      removeItem: vi.fn(),
      clear: vi.fn(),
      key: vi.fn(),
      length: 0
    } satisfies Storage;

    expect(getStoredTheme(storage)).toBeNull();
    expect(() => saveTheme(storage, 'day')).not.toThrow();
  });

  it('writes the selected theme to the root data-theme attribute', () => {
    const root = document.createElement('html');

    applyTheme('night', root);

    expect(root.dataset.theme).toBe('night');
  });
});

function makeStorage(initial: Record<string, string> = {}): Storage {
  let store = { ...initial };

  return {
    get length() {
      return Object.keys(store).length;
    },
    clear: vi.fn(() => {
      store = {};
    }),
    getItem: vi.fn((key: string) => store[key] ?? null),
    key: vi.fn((index: number) => Object.keys(store)[index] ?? null),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    })
  } satisfies Storage;
}
```

- [ ] **Step 2: Create the failing icon helper tests**

Create `src/linkIcons.test.ts` with this content:

```ts
import { describe, expect, it } from 'vitest';
import { getFallbackIconLabel, getFaviconUrl } from './linkIcons';

describe('link icon helpers', () => {
  it('builds a favicon URL from a normal website URL', () => {
    expect(getFaviconUrl('https://papermc.io/downloads/paper')).toBe(
      'https://www.google.com/s2/favicons?domain=papermc.io&sz=64'
    );
  });

  it('returns undefined for invalid or placeholder URLs', () => {
    expect(getFaviconUrl('#')).toBeUndefined();
    expect(getFaviconUrl('not a url')).toBeUndefined();
  });

  it('uses the first visible character as the fallback icon label', () => {
    expect(getFallbackIconLabel('  Paper  ')).toBe('P');
    expect(getFallbackIconLabel('粘液科技')).toBe('粘');
  });

  it('uses M when the title is empty', () => {
    expect(getFallbackIconLabel('   ')).toBe('M');
  });
});
```

- [ ] **Step 3: Run tests to verify they fail because helpers do not exist**

Run:

```bash
npm run test -- --run src/theme.test.ts src/linkIcons.test.ts
```

Expected: FAIL with module resolution errors for `./theme` and `./linkIcons`.

- [ ] **Step 4: Commit failing tests**

```bash
git add src/theme.test.ts src/linkIcons.test.ts
git commit -m "test: cover MCNAV theme and icon helpers" -m "Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 2: Implement theme and icon helpers

**Files:**
- Create: `src/theme.ts`
- Create: `src/linkIcons.ts`
- Test: `src/theme.test.ts`
- Test: `src/linkIcons.test.ts`

**Interfaces:**
- Consumes tests from Task 1.
- Produces:
  - `ThemeMode` and helper functions for `App.tsx`.
  - Favicon/fallback helpers for `NavCard`.

- [ ] **Step 1: Implement the theme helper**

Create `src/theme.ts` with this content:

```ts
export type ThemeMode = 'day' | 'night';

const THEME_STORAGE_KEY = 'mcnavTheme';

export function getStoredTheme(storage: Storage): ThemeMode | null {
  try {
    const value = storage.getItem(THEME_STORAGE_KEY);
    return isThemeMode(value) ? value : null;
  } catch {
    return null;
  }
}

export function saveTheme(storage: Storage, theme: ThemeMode): void {
  try {
    storage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // Storage can be unavailable in private modes or restricted iframes.
  }
}

export function resolveInitialTheme({ storage, prefersDark = false }: { storage?: Storage; prefersDark?: boolean }): ThemeMode {
  const storedTheme = storage ? getStoredTheme(storage) : null;
  return storedTheme ?? (prefersDark ? 'night' : 'day');
}

export function applyTheme(theme: ThemeMode, root: HTMLElement = document.documentElement): void {
  root.dataset.theme = theme;
}

function isThemeMode(value: string | null): value is ThemeMode {
  return value === 'day' || value === 'night';
}
```

- [ ] **Step 2: Implement the icon helper**

Create `src/linkIcons.ts` with this content:

```ts
export function getFaviconUrl(url: string): string | undefined {
  try {
    const parsedUrl = new URL(url);

    if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
      return undefined;
    }

    return `https://www.google.com/s2/favicons?domain=${parsedUrl.hostname}&sz=64`;
  } catch {
    return undefined;
  }
}

export function getFallbackIconLabel(title: string): string {
  const [firstCharacter] = title.trim();
  return (firstCharacter ?? 'M').toUpperCase();
}
```

- [ ] **Step 3: Run helper tests to verify they pass**

Run:

```bash
npm run test -- --run src/theme.test.ts src/linkIcons.test.ts
```

Expected: PASS for both test files.

- [ ] **Step 4: Commit helper implementation**

```bash
git add src/theme.ts src/linkIcons.ts
git commit -m "feat: add MCNAV theme and icon helpers" -m "Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 3: Update app tests for MCNAV branding, theme toggle, removed management link, and icon fallback

**Files:**
- Modify: `src/App.test.tsx`

**Interfaces:**
- Consumes:
  - Existing `<App initialCategories={categories} />` API.
  - Task 2 helper behavior indirectly through rendered cards and theme toggle.
- Produces tests for Task 4 implementation.

- [ ] **Step 1: Replace `src/App.test.tsx` with MCNAV behavior tests**

Replace `src/App.test.tsx` with this content:

```tsx
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { App } from './App';
import type { NavCategory } from './navTypes';

const categories: NavCategory[] = [
  {
    id: 'minecraft',
    name: 'Minecraft 资源',
    icon: '🎮',
    description: '游戏资源',
    links: [
      { title: 'Modrinth', url: 'https://modrinth.com', description: '模组平台', tags: ['mods'] },
      { title: 'NameMC', url: 'https://namemc.com', description: '皮肤站', tags: ['skin'] },
      { title: 'Paper', url: 'https://papermc.io/downloads/paper', description: '服务端核心', tags: ['server'] }
    ]
  }
];

describe('App', () => {
  beforeEach(() => {
    window.localStorage.clear();
    document.documentElement.removeAttribute('data-theme');
  });

  afterEach(() => {
    document.documentElement.removeAttribute('data-theme');
  });

  it('renders MCNAV branding, Minecraft copy, search box, category heading, and cards', () => {
    render(<App initialCategories={categories} />);

    expect(screen.getByRole('banner')).toHaveTextContent('MCNAV');
    expect(screen.getByRole('link', { name: 'MCNAV 首页' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '方块世界的高效入口' })).toBeInTheDocument();
    expect(screen.getByPlaceholderText('搜索核心、插件、Wiki、工具或社区资源')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Minecraft 资源/ })).toHaveAttribute('href', '#category-minecraft');
    expect(screen.getByRole('heading', { name: /Minecraft 资源/ })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Modrinth/ })).toHaveAttribute('href', 'https://modrinth.com');
  });

  it('does not render the old management link', () => {
    render(<App initialCategories={categories} />);

    expect(screen.queryByRole('link', { name: '管理记录' })).not.toBeInTheDocument();
  });

  it('toggles between day and night mode and stores the choice', async () => {
    render(<App initialCategories={categories} />);

    const toggle = screen.getByRole('button', { name: '切换到黑夜模式' });

    await userEvent.click(toggle);

    expect(document.documentElement.dataset.theme).toBe('night');
    expect(window.localStorage.getItem('mcnavTheme')).toBe('night');
    expect(screen.getByRole('button', { name: '切换到白天模式' })).toBeInTheDocument();
  });

  it('filters cards by search query', async () => {
    render(<App initialCategories={categories} />);

    await userEvent.type(screen.getByPlaceholderText('搜索核心、插件、Wiki、工具或社区资源'), 'skin');

    expect(screen.queryByRole('link', { name: /Modrinth/ })).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: /NameMC/ })).toBeInTheDocument();
  });

  it('renders generated favicon images for links without manual icons', () => {
    render(<App initialCategories={categories} />);

    expect(screen.getByRole('img', { name: '' })).toHaveAttribute(
      'src',
      'https://www.google.com/s2/favicons?domain=modrinth.com&sz=64'
    );
  });

  it('falls back to a text icon when the favicon fails to load', () => {
    render(<App initialCategories={categories} />);

    const image = screen.getAllByRole('img', { name: '' })[0];
    fireEvent.error(image);

    expect(screen.getByText('M')).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run app tests to verify they fail against the old UI**

Run:

```bash
npm run test -- --run src/App.test.tsx
```

Expected: FAIL because the app still renders TwoNav copy, the management link, no theme toggle, and old icon behavior.

- [ ] **Step 3: Commit failing app tests**

```bash
git add src/App.test.tsx
git commit -m "test: cover MCNAV app redesign behavior" -m "Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 4: Implement MCNAV app behavior and theme/icon wiring

**Files:**
- Modify: `src/App.tsx`
- Test: `src/App.test.tsx`
- Test: `src/theme.test.ts`
- Test: `src/linkIcons.test.ts`

**Interfaces:**
- Consumes:
  - `filterCategories(categories: NavCategory[], query: string): NavCategory[]`
  - `ThemeMode`, `applyTheme`, `resolveInitialTheme`, `saveTheme`
  - `getFaviconUrl(url: string): string | undefined`
  - `getFallbackIconLabel(title: string): string`
- Produces:
  - Rendered MCNAV page with theme toggle and icon fallback behavior.

- [ ] **Step 1: Replace `src/App.tsx` with MCNAV behavior**

Replace `src/App.tsx` with this content:

```tsx
import { useEffect, useMemo, useState } from 'react';
import { getFallbackIconLabel, getFaviconUrl } from './linkIcons';
import { filterCategories } from './parseMarkdownNav';
import { applyTheme, resolveInitialTheme, saveTheme, type ThemeMode } from './theme';
import type { NavCategory, NavLink } from './navTypes';
import './App.css';

interface AppProps {
  initialCategories: NavCategory[];
}

export function App({ initialCategories }: AppProps) {
  const [query, setQuery] = useState('');
  const [theme, setTheme] = useState<ThemeMode>(() => resolveInitialTheme({
    storage: typeof window === 'undefined' ? undefined : window.localStorage,
    prefersDark: typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches
  }));
  const visibleCategories = useMemo(() => filterCategories(initialCategories, query), [initialCategories, query]);
  const totalLinks = initialCategories.reduce((sum, category) => sum + category.links.length, 0);

  useEffect(() => {
    applyTheme(theme);
    saveTheme(window.localStorage, theme);
  }, [theme]);

  const nextTheme = theme === 'day' ? 'night' : 'day';
  const themeLabel = theme === 'day' ? '切换到黑夜模式' : '切换到白天模式';

  return (
    <div className="app-shell">
      <aside className="sidebar" aria-label="分类导航">
        <a className="brand-mark" href="#top" aria-label="MCNAV 首页">
          <span className="brand-icon">M</span>
          <span className="brand-copy">
            <span className="brand-text">MCNAV</span>
            <span className="brand-subtitle">Minecraft Navigation</span>
          </span>
        </a>
        <nav className="sidebar-nav">
          {initialCategories.map((category) => (
            <a key={category.id} href={`#category-${category.id}`}>
              <span>{category.icon}</span>
              <span>{category.name}</span>
            </a>
          ))}
        </nav>
      </aside>

      <main className="main-content" id="top">
        <header className="topbar" role="banner">
          <div>
            <strong>MCNAV</strong>
            <span>{initialCategories.length} 个分类 · {totalLinks} 个资源入口</span>
          </div>
          <button className="theme-toggle" type="button" onClick={() => setTheme(nextTheme)} aria-label={themeLabel}>
            <span aria-hidden="true">{theme === 'day' ? '☀️' : '🌙'}</span>
            <span>{theme === 'day' ? '白天' : '黑夜'}</span>
          </button>
        </header>

        <section className="hero" aria-labelledby="hero-title">
          <p className="eyebrow">Minecraft Navigation</p>
          <h1 id="hero-title">方块世界的高效入口</h1>
          <p className="hero-copy">收集服务端核心、插件、Wiki、开发文档、工具与社区资源，快速找到搭建 Minecraft 项目需要的入口。</p>
          <label className="search-box">
            <span aria-hidden="true">⌕</span>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="搜索核心、插件、Wiki、工具或社区资源"
              aria-label="搜索核心、插件、Wiki、工具或社区资源"
            />
          </label>
          <div className="hero-blocks" aria-hidden="true">
            <span />
            <span />
            <span />
          </div>
        </section>

        <section className="content-grid" aria-label="导航内容">
          {visibleCategories.map((category) => (
            <CategorySection key={category.id} category={category} />
          ))}
          {visibleCategories.length === 0 && <p className="empty-state">没有找到匹配的资源入口。</p>}
        </section>
      </main>
    </div>
  );
}

function CategorySection({ category }: { category: NavCategory }) {
  return (
    <section className="category-section" id={`category-${category.id}`}>
      <div className="category-heading">
        <h2><span>{category.icon}</span>{category.name}</h2>
        <p>{category.description}</p>
      </div>
      <div className="cards-grid">
        {category.links.map((link) => <NavCard key={`${category.id}-${link.url}`} link={link} />)}
      </div>
    </section>
  );
}

function NavCard({ link }: { link: NavLink }) {
  const [iconFailed, setIconFailed] = useState(false);
  const iconSource = link.icon ?? getFaviconUrl(link.url);
  const fallbackIcon = getFallbackIconLabel(link.title);
  const showImage = Boolean(iconSource) && !iconFailed;

  return (
    <a className="nav-card" href={link.url} target="_blank" rel="noreferrer" aria-label={`${link.title}：${link.description}`}>
      <span className="card-icon" aria-hidden="true">
        {showImage ? <img src={iconSource} alt="" loading="lazy" onError={() => setIconFailed(true)} /> : fallbackIcon}
      </span>
      <span className="card-copy">
        <strong>{link.title}</strong>
        <span>{link.description}</span>
      </span>
    </a>
  );
}
```

- [ ] **Step 2: Run app and helper tests**

Run:

```bash
npm run test -- --run src/App.test.tsx src/theme.test.ts src/linkIcons.test.ts
```

Expected: PASS.

- [ ] **Step 3: Commit MCNAV app behavior**

```bash
git add src/App.tsx
git commit -m "feat: update app to MCNAV theme and icon behavior" -m "Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 5: Replace CSS with Apple Clean + Minecraft Accent day/night UI

**Files:**
- Modify: `src/App.css`
- Test: `src/App.test.tsx`

**Interfaces:**
- Consumes the class names emitted by Task 4:
  - `.app-shell`, `.sidebar`, `.brand-mark`, `.brand-icon`, `.brand-copy`, `.brand-text`, `.brand-subtitle`, `.sidebar-nav`, `.main-content`, `.topbar`, `.theme-toggle`, `.hero`, `.hero-blocks`, `.search-box`, `.content-grid`, `.category-section`, `.category-heading`, `.cards-grid`, `.nav-card`, `.card-icon`, `.card-copy`, `.empty-state`.
- Produces the approved Apple/Minecraft visual direction.

- [ ] **Step 1: Replace `src/App.css` with theme-variable styling**

Replace `src/App.css` with this content:

```css
:root {
  color: #172117;
  background: #f4f8f1;
  font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", "Microsoft YaHei", sans-serif;
  --bg: #f4f8f1;
  --bg-strong: #ffffff;
  --ink: #172117;
  --muted: #68756b;
  --panel: rgba(255, 255, 255, 0.74);
  --panel-strong: rgba(255, 255, 255, 0.9);
  --line: rgba(32, 67, 39, 0.1);
  --accent: #38c75a;
  --accent-dark: #1c8d3c;
  --accent-soft: rgba(62, 203, 89, 0.16);
  --sidebar: rgba(255, 255, 255, 0.68);
  --shadow: 0 22px 70px rgba(32, 72, 41, 0.12);
  --card-shadow: 0 14px 34px rgba(32, 72, 41, 0.09);
}

:root[data-theme="night"] {
  color: #f2fff4;
  background: #07110d;
  --bg: #07110d;
  --bg-strong: #101a14;
  --ink: #f2fff4;
  --muted: #a7b7aa;
  --panel: rgba(255, 255, 255, 0.075);
  --panel-strong: rgba(255, 255, 255, 0.11);
  --line: rgba(255, 255, 255, 0.1);
  --accent: #63e67b;
  --accent-dark: #8af09b;
  --accent-soft: rgba(99, 230, 123, 0.17);
  --sidebar: rgba(255, 255, 255, 0.065);
  --shadow: 0 22px 70px rgba(0, 0, 0, 0.3);
  --card-shadow: 0 14px 34px rgba(0, 0, 0, 0.24);
}

* { box-sizing: border-box; }
html { scroll-behavior: smooth; }
body { margin: 0; min-width: 320px; color: var(--ink); background: var(--bg); }
a { color: inherit; text-decoration: none; }
button, input { font: inherit; }

body::before {
  content: "";
  position: fixed;
  inset: 0;
  z-index: -2;
  background:
    radial-gradient(circle at 18% 12%, rgba(83, 216, 103, 0.26), transparent 29rem),
    radial-gradient(circle at 88% 8%, rgba(82, 142, 255, 0.12), transparent 25rem),
    linear-gradient(135deg, var(--bg) 0%, var(--bg-strong) 100%);
}

body::after {
  content: "";
  position: fixed;
  inset: 0;
  z-index: -1;
  opacity: .28;
  background-image:
    linear-gradient(var(--line) 1px, transparent 0),
    linear-gradient(90deg, var(--line) 1px, transparent 0);
  background-size: 28px 28px;
  mask-image: linear-gradient(135deg, #000, transparent 74%);
}

.app-shell {
  min-height: 100vh;
  display: grid;
  grid-template-columns: 252px minmax(0, 1fr);
}

.sidebar {
  position: sticky;
  top: 0;
  height: 100vh;
  padding: 18px;
  background: var(--sidebar);
  border-right: 1px solid var(--line);
  backdrop-filter: blur(28px);
}

.brand-mark {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 10px 24px;
  border-bottom: 1px solid var(--line);
}

.brand-icon {
  display: grid;
  place-items: center;
  width: 42px;
  height: 42px;
  border-radius: 15px;
  background: linear-gradient(135deg, var(--accent), #247c36);
  color: #06160b;
  font-weight: 950;
  box-shadow: 0 14px 32px rgba(46, 173, 70, .26);
}

.brand-copy { display: grid; gap: 2px; }
.brand-text { font-weight: 900; letter-spacing: -.03em; }
.brand-subtitle { color: var(--muted); font-size: 11px; letter-spacing: .08em; text-transform: uppercase; }

.sidebar-nav { display: grid; gap: 7px; margin-top: 18px; }
.sidebar-nav a {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 11px 12px;
  border-radius: 16px;
  color: var(--muted);
  transition: background .2s, color .2s, transform .2s;
}
.sidebar-nav a:hover {
  background: var(--panel-strong);
  color: var(--ink);
  transform: translateX(3px);
}

.main-content { min-width: 0; padding: 0 34px 64px; }
.topbar {
  position: sticky;
  top: 0;
  z-index: 4;
  display: flex;
  justify-content: space-between;
  align-items: center;
  min-height: 76px;
  backdrop-filter: blur(24px);
  background: color-mix(in srgb, var(--bg) 76%, transparent);
  border-bottom: 1px solid var(--line);
}
.topbar div { display: flex; gap: 12px; align-items: baseline; }
.topbar strong { font-weight: 900; letter-spacing: -.03em; }
.topbar span { color: var(--muted); font-size: 13px; }
.theme-toggle {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-height: 38px;
  padding: 0 14px;
  border: 1px solid var(--line);
  border-radius: 999px;
  color: var(--ink);
  background: var(--panel-strong);
  box-shadow: var(--card-shadow);
  cursor: pointer;
}
.theme-toggle span:first-child { color: inherit; font-size: 15px; }

.hero {
  position: relative;
  overflow: hidden;
  margin: 38px 0 38px;
  padding: 52px;
  border: 1px solid rgba(255,255,255,.48);
  border-radius: 38px;
  background: linear-gradient(135deg, var(--panel-strong), var(--panel));
  box-shadow: var(--shadow);
  backdrop-filter: blur(24px);
}
.hero::before {
  content: "⛏️";
  position: absolute;
  right: 52px;
  bottom: 46px;
  display: grid;
  place-items: center;
  width: 112px;
  height: 112px;
  border-radius: 31px;
  background: var(--accent-soft);
  font-size: 46px;
  transform: rotate(8deg);
}
.eyebrow {
  margin: 0 0 10px;
  color: var(--accent-dark);
  font-size: 12px;
  font-weight: 900;
  letter-spacing: .18em;
  text-transform: uppercase;
}
.hero h1 {
  position: relative;
  max-width: 760px;
  margin: 0;
  font-size: clamp(40px, 6vw, 82px);
  line-height: .94;
  letter-spacing: -.07em;
}
.hero-copy { position: relative; max-width: 690px; color: var(--muted); font-size: 17px; line-height: 1.8; }
.search-box {
  position: relative;
  display: flex;
  align-items: center;
  gap: 14px;
  max-width: 760px;
  margin-top: 30px;
  padding: 0 20px;
  height: 64px;
  border-radius: 22px;
  background: var(--panel-strong);
  border: 1px solid var(--line);
  box-shadow: var(--card-shadow);
}
.search-box span { color: var(--accent-dark); font-size: 25px; }
.search-box input {
  width: 100%;
  border: 0;
  outline: 0;
  color: var(--ink);
  background: transparent;
}
.search-box input::placeholder { color: var(--muted); }
.hero-blocks {
  position: absolute;
  right: 46px;
  top: 42px;
  display: grid;
  grid-template-columns: repeat(2, 26px);
  gap: 8px;
  opacity: .8;
}
.hero-blocks span {
  width: 26px;
  height: 26px;
  border-radius: 7px;
  background: var(--accent-soft);
  border: 1px solid var(--line);
}
.hero-blocks span:nth-child(3) { grid-column: 2; }

.content-grid { display: grid; gap: 36px; }
.category-section { scroll-margin-top: 96px; }
.category-heading {
  display: flex;
  align-items: flex-end;
  gap: 18px;
  margin-bottom: 17px;
}
.category-heading h2 {
  margin: 0;
  display: flex;
  gap: 10px;
  align-items: center;
  font-size: 22px;
  letter-spacing: -.03em;
}
.category-heading p { margin: 0; color: var(--muted); }
.cards-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(252px, 1fr));
  gap: 16px;
}
.nav-card {
  display: flex;
  align-items: center;
  gap: 14px;
  min-height: 88px;
  padding: 16px;
  border-radius: 24px;
  background: var(--panel);
  border: 1px solid var(--line);
  box-shadow: var(--card-shadow);
  backdrop-filter: blur(18px);
  transition: transform .2s, box-shadow .2s, border-color .2s, background .2s;
}
.nav-card:hover {
  transform: translateY(-4px);
  border-color: color-mix(in srgb, var(--accent) 55%, var(--line));
  background: var(--panel-strong);
  box-shadow: var(--shadow);
}
.card-icon {
  flex: 0 0 auto;
  display: grid;
  place-items: center;
  width: 44px;
  height: 44px;
  border-radius: 16px;
  background: var(--accent-soft);
  color: var(--accent-dark);
  font-weight: 950;
  overflow: hidden;
}
.card-icon img { width: 26px; height: 26px; object-fit: contain; }
.card-copy { min-width: 0; display: grid; gap: 5px; }
.card-copy strong { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; letter-spacing: -.02em; }
.card-copy span { color: var(--muted); font-size: 13px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.empty-state { padding: 28px; border-radius: 24px; background: var(--panel); color: var(--muted); border: 1px solid var(--line); }

@media (max-width: 900px) {
  .app-shell { grid-template-columns: 1fr; }
  .sidebar {
    position: static;
    height: auto;
    border-right: 0;
    border-bottom: 1px solid var(--line);
    border-radius: 0 0 28px 28px;
  }
  .sidebar-nav { grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); }
  .main-content { padding: 0 16px 44px; }
  .topbar { min-height: 64px; }
  .topbar div { display: grid; gap: 2px; }
  .hero { padding: 32px; border-radius: 28px; }
  .hero::before { display: none; }
  .hero-blocks { display: none; }
  .category-heading { display: block; }
}
```

- [ ] **Step 2: Run app tests after CSS replacement**

Run:

```bash
npm run test -- --run src/App.test.tsx
```

Expected: PASS. CSS changes should not break behavior tests.

- [ ] **Step 3: Commit redesigned CSS**

```bash
git add src/App.css
git commit -m "style: apply Apple Minecraft MCNAV UI" -m "Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 6: Add content quality tests for active Markdown files

**Files:**
- Modify: `src/contentCategories.test.ts`
- Test: `content/categories/*.md`

**Interfaces:**
- Consumes active Markdown loaded by `import.meta.glob('../content/categories/*.md')`.
- Produces tests that fail until active Markdown descriptions are cleaned.

- [ ] **Step 1: Replace `src/contentCategories.test.ts` with stricter content checks**

Replace `src/contentCategories.test.ts` with this content:

```ts
import { describe, expect, it } from 'vitest';
import { parseMarkdownCategory } from './parseMarkdownNav';

const modules = import.meta.glob('../content/categories/*.md', {
  eager: true,
  query: '?raw',
  import: 'default'
}) as Record<string, string>;

describe('content categories', () => {
  it('parses every active Markdown category file without throwing', () => {
    const categories = parseCategories();

    expect(categories.length).toBeGreaterThan(0);
    expect(categories.some((category) => category.links.length > 0)).toBe(true);
  });

  it('does not expose TwoNav import boilerplate in active content', () => {
    for (const [path, markdown] of Object.entries(modules)) {
      expect(markdown, path).not.toMatch(/TwoNav|自动导入|书签导入/);
    }
  });

  it('uses meaningful category and link descriptions instead of repeated category names', () => {
    const categories = parseCategories();

    for (const category of categories) {
      expect(category.description, category.id).not.toBe(category.name);
      expect(category.description.trim().length, category.id).toBeGreaterThan(6);

      for (const link of category.links) {
        expect(link.description, `${category.id}:${link.title}`).not.toBe(category.name);
        expect(link.description.trim().length, `${category.id}:${link.title}`).toBeGreaterThan(6);
      }
    }
  });
});

function parseCategories() {
  return Object.entries(modules).map(([path, markdown]) => {
    const fallbackId = path.split('/').pop()?.replace(/\.md$/, '') ?? path;
    return parseMarkdownCategory(markdown, fallbackId);
  });
}
```

- [ ] **Step 2: Run content tests to verify they fail on imported boilerplate**

Run:

```bash
npm run test -- --run src/contentCategories.test.ts
```

Expected: FAIL because active Markdown files still contain `TwoNav`, `自动导入`, or link descriptions that equal their category names.

- [ ] **Step 3: Commit failing content quality test**

```bash
git add src/contentCategories.test.ts
git commit -m "test: require meaningful MCNAV content descriptions" -m "Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 7: Clean active Markdown category and link descriptions

**Files:**
- Modify: `content/categories/01-announcements.md`
- Modify: `content/categories/04-server-core.md`
- Modify: `content/categories/05-wiki.md`
- Modify: `content/categories/06-dev-docs.md`
- Modify: `content/categories/07-tools.md`
- Modify: `content/categories/08-community-forums.md`
- Modify: `content/categories/09-contact.md`
- Modify: `content/categories/10-friend-links.md`
- Modify: `content/categories/11-paid-plugins-cn.md`
- Modify: `content/categories/12-private-collection.md`
- Modify: `content/categories/13-plugin-recommendations.md`
- Test: `src/contentCategories.test.ts`

**Interfaces:**
- Consumes content quality test from Task 6.
- Produces active Markdown with no TwoNav import boilerplate and meaningful descriptions.

- [ ] **Step 1: Rewrite category-level descriptions**

Use these exact category descriptions in the YAML frontmatter:

```yaml
# content/categories/01-announcements.md
description: "MCNAV 站点公告、交流群、赞助与广告合作入口。"

# content/categories/04-server-core.md
description: "常见 Minecraft 服务端核心、代理端与混合端项目入口。"

# content/categories/05-wiki.md
description: "Minecraft 插件、玩法系统、开服教程与百科资料集合。"

# content/categories/06-dev-docs.md
description: "Minecraft 服务端、模组、插件与 Java 开发相关 API 文档。"

# content/categories/07-tools.md
description: "服主、开发者与运维常用的生成器、诊断和辅助工具。"

# content/categories/08-community-forums.md
description: "Minecraft 中文社区、资源平台、论坛与模组发布入口。"

# content/categories/09-contact.md
description: "联系 MCNAV 站长、加入社群或支持项目维护。"

# content/categories/10-friend-links.md
description: "与 MCNAV 相关的友站、教程站和 Minecraft 资源站。"

# content/categories/11-paid-plugins-cn.md
description: "国内开发者维护的付费插件、商业玩法系统和文档入口。"

# content/categories/12-private-collection.md
description: "站长收藏的实用项目、插件资源与个人常用入口。"

# content/categories/13-plugin-recommendations.md
description: "适合服务器搭建与玩法扩展的常用插件推荐入口。"
```

- [ ] **Step 2: Rewrite link descriptions with category-specific title-based text**

For each active Markdown file, replace link descriptions that currently equal the category name with title-specific text using this exact rule set:

```text
01-announcements.md:
  赞助我喵 -> 支持 MCNAV 继续维护与内容更新。
  点击加入官方交流群 -> 加入 MCNAV 官方交流群反馈站点和资源。
  广告 -> 查看 MCNAV 广告合作与展示规则。

04-server-core.md:
  <title> -> <title> 的服务端核心、代理端或混合端项目入口。

05-wiki.md:
  <title> -> <title> 的使用文档、配置说明或百科资料。

06-dev-docs.md:
  <title> -> <title> 相关 API、Javadoc 或开发参考文档。

07-tools.md:
  服务器状态图生成器 -> 生成 Minecraft 服务器状态展示图。
  Minecraft 渐变颜色生成器 -> 生成 Minecraft 文本渐变颜色代码。
  MinePay -> 面向 Minecraft 服务器的支付与赞助工具。
  CrashMc -> 分析 Minecraft 崩溃日志与报错信息。
  Oasis插件搜索 -> 搜索 Oasis 收录的 Minecraft 插件资源。
  motd生成器 -> 在线生成 Minecraft 服务器 MOTD 样式。
  McPatch -> Minecraft 资源或客户端补丁相关工具文档。
  flags.sh -> 生成适合 Minecraft 服务端的 JVM 启动参数。

08-community-forums.md:
  <title> -> <title> 的社区、论坛或 Minecraft 资源发布入口。

09-contact.md:
  爱发电 -> 通过爱发电支持站长和 MCNAV 维护。
  Telegram -> 通过 Telegram 联系站长或获取站点动态。
  QQ -> 通过 QQ 联系站长或加入交流入口。

10-friend-links.md:
  Bukkit -> Bukkit Wiki 与 Minecraft 插件资料友站。
  MC灵依资源网 -> Minecraft 资源下载与分享友站。
  笨蛋开服教程 -> 面向新手的 Minecraft 开服教程站。

11-paid-plugins-cn.md:
  <title> -> <title> 的国产付费插件或商业玩法文档入口。

12-private-collection.md:
  SnowCutieOwO/Continue: Personal translated files (and other stuffs) database. -> SnowCutieOwO 维护的翻译文件与个人资料仓库。
  endurance -> Endurance 体力系统插件的 Spigot 资源页。

13-plugin-recommendations.md:
  <title> -> <title> 插件的下载、文档或项目入口。
```

- [ ] **Step 3: Remove imported body text from active Markdown files**

For every active `content/categories/*.md`, remove this body text when present:

```md
由 `TwoNav_bookmarks_20260702_144430.html` 自动导入。
```

Keep the closing frontmatter marker `---` and allow the file to end immediately after it.

- [ ] **Step 4: Run content tests to verify cleaned descriptions pass**

Run:

```bash
npm run test -- --run src/contentCategories.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit Markdown cleanup**

```bash
git add content/categories src/contentCategories.test.ts
git commit -m "content: rewrite MCNAV category descriptions" -m "Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 8: Run full verification and fix integration issues

**Files:**
- Modify only files touched by Tasks 1-7 if verification reveals an issue.
- Test: all project tests and production build.

**Interfaces:**
- Consumes all previous tasks.
- Produces verified implementation ready for review.

- [ ] **Step 1: Run the full test suite**

Run:

```bash
npm run test -- --run
```

Expected: all tests PASS, including:

- `src/parseMarkdownNav.test.ts`
- `src/App.test.tsx`
- `src/contentCategories.test.ts`
- `src/theme.test.ts`
- `src/linkIcons.test.ts`

- [ ] **Step 2: If tests fail, fix the smallest specific issue**

Use the failure message to make a targeted correction. Examples of allowed targeted corrections:

```ts
// If a Testing Library query fails because there are multiple decorative images,
// change a single-image query to getAllByRole and assert on the first generated favicon.
expect(screen.getAllByRole('img', { name: '' })[0]).toHaveAttribute('src', expectedSrc);
```

```ts
// If localStorage is unavailable in a test environment, guard the save call.
if (typeof window !== 'undefined') {
  saveTheme(window.localStorage, theme);
}
```

After each correction, rerun:

```bash
npm run test -- --run
```

Expected: all tests PASS.

- [ ] **Step 3: Run production build**

Run:

```bash
npm run build
```

Expected: TypeScript build and Vite production build both succeed.

- [ ] **Step 4: Commit verification fixes if any files changed**

If Step 2 required changes, commit them:

```bash
git add src content/categories
git commit -m "fix: resolve MCNAV verification issues" -m "Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

If no files changed, skip this commit.

---

## Self-Review

- Spec coverage: Tasks 3-5 cover MCNAV branding, Apple/Minecraft UI, day/night mode, theme persistence, management-link removal, search retention, and icon behavior. Tasks 6-7 cover active Markdown description cleanup. Task 8 covers final test/build verification.
- Placeholder scan: The plan contains no TBD/TODO/fill-later placeholders. Every file path and interface name is concrete.
- Type consistency: `ThemeMode`, `resolveInitialTheme`, `applyTheme`, `saveTheme`, `getFaviconUrl`, and `getFallbackIconLabel` are introduced in Tasks 1-2 and consumed with the same names in Task 4.
- Scope check: The work is one coherent frontend/content redesign. No backend/admin/database subsystem is included.
