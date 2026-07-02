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
        <img className="brand-icon" src="/logo.png" alt="MCNAV logo" />
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
      <h1 id="hero-title">服主之家</h1>
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
