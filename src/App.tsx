import { useEffect, useMemo, useState } from 'react'
import { getFallbackIconLabel, getFaviconUrl } from './linkIcons'
import { filterCategories } from './parseMarkdownNav'
import { parseRoute, type Route } from './router'
import { renderMarkdown } from './markdown'
import {
  applyTheme,
  getNextTheme,
  getStoredTheme,
  resolveTheme,
  saveTheme,
  type ThemeMode
} from './theme'
import type { ArticlePost } from './postTypes'
import type { NavCategory, NavLink } from './navTypes'
import './App.css'

interface AppProps {
  initialCategories: NavCategory[]
  initialPosts?: ArticlePost[]
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

export function App({ initialCategories, initialPosts = [] }: AppProps) {
  const [query, setQuery] = useState('')
  const [themeMode, setThemeMode] = useState<ThemeMode>(() => {
    if (typeof window === 'undefined') {
      return 'system'
    }

    return getStoredTheme(window.localStorage) ?? 'system'
  })
  const [prefersDark, setPrefersDark] = useState(() => getPrefersDark())
  const [route, setRoute] = useState<Route>(() =>
    parseRoute(typeof window === 'undefined' ? '/' : window.location.pathname)
  )
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

  useEffect(() => {
    const onPop = () => setRoute(parseRoute(window.location.pathname))
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [])

  const navigate = (path: string) => {
    window.history.pushState({}, '', path)
    setRoute(parseRoute(path))
    if (typeof window.scrollTo === 'function') {
      window.scrollTo(0, 0)
    }
  }

  const isHome = route.name === 'home'
  const activePost = route.name === 'post' ? initialPosts.find((post) => post.slug === route.slug) : undefined

  return (
    <div className="app-shell" data-layout={isHome ? 'full-bleed' : 'single-column'}>
      {isHome && <Sidebar categories={initialCategories} />}

      <main className="main-content" id="top">
        <header className="topbar" role="banner">
          <div className="topbar-copy">
            {isHome ? (
              <>
                <strong>MCNAV</strong>
                <span className="topbar-stat">{initialCategories.length} 个分类 · {totalLinks} 个资源入口</span>
              </>
            ) : (
              <button type="button" className="back-button" onClick={() => navigate('/')}>
                <span aria-hidden="true">←</span> 返回导航首页
              </button>
            )}
          </div>
          <div className="topbar-actions">
            <RepoLink />
            <ThemeToggle themeMode={themeMode} onToggle={() => setThemeMode(getNextTheme(themeMode))} />
          </div>
        </header>

        {isHome && (
          <>
            <Hero />
            <SearchPanel query={query} visibleLinks={visibleLinks} totalLinks={totalLinks} onQueryChange={setQuery} />

            <div className="category-stack" aria-live="polite">
              {visibleCategories.map((category) => (
                <CategorySection key={category.id} category={category} onNavigate={navigate} />
              ))}
            </div>

            <Footer />
          </>
        )}

        {!isHome && (activePost ? <PostView post={activePost} /> : <NotFoundView />)}
      </main>
    </div>
  )
}

function Sidebar({ categories }: { categories: NavCategory[] }) {
  return (
    <aside className="sidebar" aria-label="分类导航">
      <a className="brand-mark" href="#top" aria-label="MCNAV 首页">
        <img className="brand-icon" src="/Nether_Star.gif" alt="MCNAV logo" />
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

function CategorySection({ category, onNavigate }: { category: NavCategory; onNavigate: (path: string) => void }) {
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
          <NavCard key={`${category.id}-${link.title}-${link.url}`} link={link} categoryIcon={category.icon} onNavigate={onNavigate} />
        ))}
      </div>
    </section>
  )
}

function NavCard({ link, categoryIcon, onNavigate }: { link: NavLink; categoryIcon: string; onNavigate: (path: string) => void }) {
  const isInternal = link.url.startsWith('/posts/')

  return (
    <a
      className="nav-card"
      href={link.url}
      target={isInternal ? undefined : '_blank'}
      rel={isInternal ? undefined : 'noreferrer'}
      onClick={(event) => {
        if (!isInternal) {
          return
        }
        event.preventDefault()
        onNavigate(link.url)
      }}
    >
      <LinkIcon link={link} categoryIcon={categoryIcon} />
      <span className="card-content">
        <strong>{link.title}</strong>
        <span>{link.description}</span>
      </span>
      <span className="card-arrow" aria-hidden="true">{isInternal ? '→' : '↗'}</span>
      <span className="card-tooltip" aria-hidden="true">{link.description}</span>
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

function PostView({ post }: { post: ArticlePost }) {
  return (
    <article className="post-page">
      <header className="post-header">
        <h1 className="post-title">{post.title}</h1>
        {post.description && <p className="post-description">{post.description}</p>}
        {(post.date || post.tags.length > 0) && (
          <div className="post-meta">
            {post.date && <time className="post-date">{post.date}</time>}
            {post.tags.length > 0 && (
              <ul className="post-tags">
                {post.tags.map((tag) => (
                  <li key={tag}>{tag}</li>
                ))}
              </ul>
            )}
          </div>
        )}
      </header>
      <div className="post-body">{renderMarkdown(post.body)}</div>
    </article>
  )
}

function NotFoundView() {
  return (
    <section className="not-found">
      <h1>文章不存在</h1>
      <p>你访问的页面没有找到，它可能已被移动或从未存在。</p>
    </section>
  )
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

function RepoLink() {
  return (
    <a
      className="repo-link"
      href="https://github.com/thisxiaoyuQAQ/Nav-Minecraft"
      target="_blank"
      rel="noreferrer"
      aria-label="GitHub 仓库"
    >
      <svg viewBox="0 0 16 16" aria-hidden="true" focusable="false">
        <path
          fill="currentColor"
          d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"
        />
      </svg>
    </a>
  )
}

function Footer() {
  return (
    <footer className="site-footer">
      <a
        className="beian-link"
        href="https://beian.miit.gov.cn/"
        target="_blank"
        rel="nofollow"
      >
        苏ICP备2024112104号-4
      </a>
      <a
        className="beian-link beian-link--police"
        href="https://beian.mps.gov.cn/#/query/webSearch?code=32020602003572"
        target="_blank"
        rel="noreferrer"
      >
        <img className="beian-icon" src="/备案图标.png" alt="" />
        苏公网安备32020602003572号
      </a>
    </footer>
  )
}

function getPrefersDark(): boolean {
  return typeof window !== 'undefined' && Boolean(window.matchMedia?.('(prefers-color-scheme: dark)').matches)
}
