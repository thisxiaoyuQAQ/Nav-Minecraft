import { act, fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { App } from './App'
import type { ArticlePost } from './postTypes'
import type { NavCategory } from './navTypes'

const categories: NavCategory[] = [
  {
    id: 'minecraft',
    name: 'Minecraft 资源',
    icon: '🎮',
    description: '游戏资源',
    links: [
      { type: 'link', title: 'Modrinth', url: 'https://modrinth.com', description: '模组平台', tags: ['mods'] },
      { type: 'link', title: 'NameMC', url: 'https://namemc.com', description: '皮肤站', tags: ['skin'] },
      { type: 'link', title: 'Paper', url: 'https://papermc.io/downloads/paper', description: '服务端核心', tags: ['server'] }
    ]
  }
]

const groupedCategories: NavCategory[] = [
  {
    id: 'server-core',
    name: 'Mod服核心',
    icon: '🧩',
    description: '服务端核心',
    links: [
      { type: 'link', title: 'Paper', url: 'https://papermc.io/downloads/paper', description: '服务端核心', tags: ['server'] },
      {
        type: 'group',
        name: '加载器核心',
        links: [
          { type: 'link', title: 'Forge', url: 'https://files.minecraftforge.net', description: 'Forge 服务端', tags: ['forge'] },
          { type: 'link', title: 'Fabric', url: 'https://fabricmc.net/use/server', description: 'Fabric 服务端', tags: ['fabric'] }
        ]
      },
      { type: 'link', title: 'Velocity', url: 'https://papermc.io/software/velocity', description: '代理核心', tags: ['proxy'] }
    ]
  }
]

const multiGroupCategories: NavCategory[] = [
  {
    id: 'server-core',
    name: '服务端核心',
    icon: '🧱',
    description: '服务端核心',
    links: [
      {
        type: 'group',
        name: '原版核心',
        links: [
          { type: 'link', title: 'Vanilla', url: 'https://getbukkit.org/vanilla', description: '原版核心', tags: ['vanilla'] }
        ]
      },
      {
        type: 'group',
        name: 'Bukkit / Paper 系',
        links: [
          { type: 'link', title: 'Spigot', url: 'https://getbukkit.org/spigot', description: 'Spigot 核心', tags: ['spigot'] },
          { type: 'link', title: 'Paper', url: 'https://papermc.io/paper', description: 'Paper 核心', tags: ['paper'] }
        ]
      }
    ]
  }
]

describe('App', () => {
  beforeEach(() => {
    window.localStorage.clear()
    document.documentElement.removeAttribute('data-theme')
    document.documentElement.removeAttribute('data-theme-mode')
    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: query.includes('dark'),
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn()
    }))
  })

  afterEach(() => {
    document.documentElement.removeAttribute('data-theme')
    document.documentElement.removeAttribute('data-theme-mode')
  })

  it('renders MCNAV branding, Minecraft copy, search box, category heading, and cards', () => {
    const { container } = render(<App initialCategories={categories} />)

    expect(screen.getByRole('banner')).toHaveTextContent('MCNAV')
    expect(screen.getByRole('link', { name: 'MCNAV 首页' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: '服主之家' })).toBeInTheDocument()
    expect(screen.getByText('收集服务端核心、插件 Wiki、开发文档、工具与社区资源。')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('搜索核心、插件、Wiki、工具或服务器资源')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Minecraft 资源/ })).toHaveAttribute('href', '#category-minecraft')
    expect(screen.getByRole('heading', { name: /Minecraft 资源/ })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Modrinth/ })).toHaveAttribute('href', 'https://modrinth.com')

    const tooltip = container.querySelector('.nav-card .card-tooltip')
    expect(tooltip).toHaveTextContent('模组平台')
    expect(tooltip).toHaveAttribute('aria-hidden', 'true')
  })

  it('renders full-screen UI structure hooks for the refreshed design', () => {
    const { container } = render(<App initialCategories={categories} />)

    expect(container.querySelector('.app-shell')).toHaveAttribute('data-layout', 'full-bleed')
    const brandIcon = container.querySelector('.brand-icon')
    expect(brandIcon?.tagName).toBe('IMG')
    expect(brandIcon).toHaveAttribute('src', '/Nether_Star.gif')
    expect(brandIcon).toHaveAttribute('alt', 'MCNAV logo')
    expect(container.querySelector('.topbar-copy')).toBeInTheDocument()
    expect(container.querySelector('.topbar-stat')).toHaveTextContent('1 个分类 · 3 个资源入口')
    expect(container.querySelector('.hero-glow')).toBeInTheDocument()
    expect(container.querySelector('.hero-pattern')).not.toBeInTheDocument()
    expect(container.querySelector('.hero-block-field')).toBeInTheDocument()
    expect(container.querySelectorAll('.hero-block')).toHaveLength(14)
    expect(container.querySelector('.search-meta')).toHaveTextContent('共收录 3 个资源入口')
  })

  it('renders grouped entries in order and counts real links', async () => {
    render(<App initialCategories={groupedCategories} />)

    expect(screen.getByText('1 个分类 · 4 个资源入口')).toBeInTheDocument()
    expect(screen.getByText('共收录 4 个资源入口')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Mod服核心' })).toBeInTheDocument()

    const cards = screen.getAllByRole('link').filter((link) => link.classList.contains('nav-card'))
    expect(cards.map((card) => card.textContent)).toEqual([
      expect.stringContaining('Paper'),
      expect.stringContaining('Forge'),
      expect.stringContaining('Fabric'),
      expect.stringContaining('Velocity')
    ])

    await userEvent.type(screen.getByPlaceholderText('搜索核心、插件、Wiki、工具或服务器资源'), 'fabric')

    expect(screen.getByText('找到 1 / 4 个资源')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Mod服核心' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Fabric/ })).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /Forge/ })).not.toBeInTheDocument()
  })

  it('renders a subcategory filter for categories with multiple groups', () => {
    render(<App initialCategories={multiGroupCategories} />)

    const filter = screen.getByRole('group', { name: '服务端核心 二级分类筛选' })
    expect(within(filter).getByRole('button', { name: '全部' })).toHaveAttribute('aria-pressed', 'true')
    expect(within(filter).getByRole('button', { name: '原版核心' })).toBeInTheDocument()
    expect(within(filter).getByRole('button', { name: 'Bukkit / Paper 系' })).toBeInTheDocument()
  })

  it('does not show a subcategory filter for categories with fewer than two groups', () => {
    render(<App initialCategories={groupedCategories} />)

    expect(screen.queryByRole('group', { name: /二级分类筛选/ })).not.toBeInTheDocument()
  })

  it('filters cards to the selected subcategory and restores on 全部', async () => {
    const { container } = render(<App initialCategories={multiGroupCategories} />)

    const cards = () => screen.getAllByRole('link').filter((link) => link.classList.contains('nav-card'))
    const totalBadge = () => container.querySelector('.category-total')

    expect(cards().map((card) => card.textContent)).toEqual([
      expect.stringContaining('Vanilla'),
      expect.stringContaining('Spigot'),
      expect.stringContaining('Paper')
    ])
    expect(totalBadge()).toHaveTextContent('3')

    await userEvent.click(screen.getByRole('button', { name: 'Bukkit / Paper 系' }))

    expect(cards().map((card) => card.textContent)).toEqual([
      expect.stringContaining('Spigot'),
      expect.stringContaining('Paper')
    ])
    expect(screen.queryByRole('link', { name: /Vanilla/ })).not.toBeInTheDocument()
    expect(totalBadge()).toHaveTextContent('2')

    await userEvent.click(screen.getByRole('button', { name: '全部' }))

    expect(cards().map((card) => card.textContent)).toEqual([
      expect.stringContaining('Vanilla'),
      expect.stringContaining('Spigot'),
      expect.stringContaining('Paper')
    ])
  })

  it('shows matching results when a search hides the selected subcategory', async () => {
    render(<App initialCategories={multiGroupCategories} />)

    await userEvent.click(screen.getByRole('button', { name: '原版核心' }))
    expect(screen.getByRole('link', { name: /Vanilla/ })).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /Spigot/ })).not.toBeInTheDocument()

    await userEvent.type(screen.getByPlaceholderText('搜索核心、插件、Wiki、工具或服务器资源'), 'paper')

    // 原版核心 has no Paper match; the section falls back to showing the Paper result
    // instead of staying stuck on an empty 原版核心 selection.
    expect(screen.getByRole('link', { name: /Paper/ })).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /Vanilla/ })).not.toBeInTheDocument()
  })

  it('does not render old product or management entry points', () => {
    render(<App initialCategories={categories} />)

    expect(screen.queryByText('TwoNav')).not.toBeInTheDocument()
    expect(screen.queryByText('管理记录')).not.toBeInTheDocument()
    expect(screen.queryByText('系统管理')).not.toBeInTheDocument()
  })

  it('renders a GitHub repo link with the last commit date, next to the theme toggle', () => {
    render(<App initialCategories={categories} />)

    const repo = screen.getByRole('link', { name: /GitHub 仓库/ })
    expect(repo).toHaveAttribute('href', 'https://github.com/thisxiaoyuQAQ/Nav-Minecraft')
    expect(repo).toHaveAttribute('target', '_blank')
    expect(repo).toHaveAttribute('rel', 'noreferrer')
    expect(repo).toHaveTextContent(/最后提交 \d{4}-\d{2}-\d{2}/)

    const toggle = screen.getByRole('button', { name: '切换主题：当前跟随系统' })
    expect(repo.compareDocumentPosition(toggle)).toBe(Node.DOCUMENT_POSITION_FOLLOWING)
  })

  it('cycles theme from system to light to dark and stores the choice', async () => {
    render(<App initialCategories={categories} />)

    const toggle = screen.getByRole('button', { name: '切换主题：当前跟随系统' })
    expect(document.documentElement.dataset.themeMode).toBe('system')
    expect(document.documentElement.dataset.theme).toBe('dark')

    await userEvent.click(toggle)

    expect(document.documentElement.dataset.themeMode).toBe('light')
    expect(window.localStorage.getItem('mcnavTheme')).toBe('light')
    expect(screen.getByRole('button', { name: '切换主题：当前白天' })).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: '切换主题：当前白天' }))
    expect(document.documentElement.dataset.themeMode).toBe('dark')
  })

  it('filters cards by search query', async () => {
    render(<App initialCategories={categories} />)

    await userEvent.type(screen.getByPlaceholderText('搜索核心、插件、Wiki、工具或服务器资源'), 'skin')

    expect(screen.queryByRole('link', { name: /Modrinth/ })).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: /NameMC/ })).toBeInTheDocument()
  })

  it('renders generated favicon images for links without manual icons', () => {
    render(<App initialCategories={categories} />)

    const modrinthCard = screen.getByRole('link', { name: /Modrinth/ })
    expect(within(modrinthCard).getByAltText('')).toHaveAttribute(
      'src',
      'https://www.google.com/s2/favicons?domain=modrinth.com&sz=64'
    )
  })

  it('renders ICP and public security beian links in the footer', () => {
    render(<App initialCategories={categories} />)

    const icp = screen.getByRole('link', { name: '苏ICP备2024112104号-4' })
    expect(icp).toHaveAttribute('href', 'https://beian.miit.gov.cn/')
    expect(icp).toHaveAttribute('target', '_blank')
    expect(icp).toHaveAttribute('rel', 'nofollow')

    const police = screen.getByRole('link', { name: '苏公网安备32020602003572号' })
    expect(police).toHaveAttribute(
      'href',
      'https://beian.mps.gov.cn/#/query/webSearch?code=32020602003572'
    )
    expect(police).toHaveAttribute('target', '_blank')
    expect(police).toHaveAttribute('rel', 'noreferrer')
  })

  it('falls back to a text icon when the favicon fails to load', () => {
    render(<App initialCategories={categories} />)

    const modrinthCard = screen.getByRole('link', { name: /Modrinth/ })
    const image = within(modrinthCard).getByAltText('')
    fireEvent.error(image)

    expect(within(modrinthCard).getByText('M')).toBeInTheDocument()
  })

  it('renders the home view when there are no posts', () => {
    render(<App initialCategories={categories} initialPosts={[]} />)
    expect(screen.getByRole('heading', { name: '服主之家' })).toBeInTheDocument()
  })

  const routingPosts: ArticlePost[] = [
    {
      slug: 'server-core-guide',
      title: '服务端核心选择指南',
      description: '选择核心。',
      date: '2026-07-03',
      tags: ['server', 'guide'],
      body: '## 什么时候用 Folia\n\nFolia 适合并行。'
    }
  ]

  const routingCategories: NavCategory[] = [
    {
      id: 'minecraft',
      name: 'Minecraft 资源',
      icon: '🎮',
      description: '游戏资源',
      links: [
        { type: 'link', title: 'Modrinth', url: 'https://modrinth.com', description: '模组平台', tags: ['mods'] },
        { type: 'link', title: '服务端核心选择指南', url: '/posts/server-core-guide', description: '内部文章', tags: ['guide'] },
        { type: 'link', title: '失踪文章', url: '/posts/missing', description: '测试 404', tags: ['test'] }
      ]
    }
  ]

  describe('routing', () => {
    beforeEach(() => {
      window.history.replaceState({}, '', '/')
    })

    it('renders the home view at the root path', () => {
      render(<App initialCategories={routingCategories} initialPosts={routingPosts} />)
      expect(screen.getByRole('heading', { name: '服主之家' })).toBeInTheDocument()
    })

    it('keeps external links opening in a new tab and internal links in-page', () => {
      render(<App initialCategories={routingCategories} initialPosts={routingPosts} />)
      expect(screen.getByRole('link', { name: /Modrinth/ })).toHaveAttribute('target', '_blank')
      expect(screen.getByRole('link', { name: /服务端核心选择指南/ })).not.toHaveAttribute('target')
    })

    it('navigates to an internal article when its card is clicked', async () => {
      render(<App initialCategories={routingCategories} initialPosts={routingPosts} />)
      await userEvent.click(screen.getByRole('link', { name: /服务端核心选择指南/ }))

      expect(screen.getByRole('heading', { name: '服务端核心选择指南' })).toBeInTheDocument()
      expect(screen.getByText('Folia 适合并行。')).toBeInTheDocument()
      expect(screen.queryByRole('heading', { name: '服主之家' })).not.toBeInTheDocument()
    })

    it('returns home via the back button', async () => {
      render(<App initialCategories={routingCategories} initialPosts={routingPosts} />)
      await userEvent.click(screen.getByRole('link', { name: /服务端核心选择指南/ }))

      await userEvent.click(screen.getByRole('button', { name: /返回导航首页/ }))

      expect(screen.getByRole('heading', { name: '服主之家' })).toBeInTheDocument()
    })

    it('returns home on browser back after opening an article', async () => {
      render(<App initialCategories={routingCategories} initialPosts={routingPosts} />)
      await userEvent.click(screen.getByRole('link', { name: /服务端核心选择指南/ }))

      await act(async () => {
        window.history.pushState({}, '', '/')
        window.dispatchEvent(new PopStateEvent('popstate'))
      })

      expect(screen.getByRole('heading', { name: '服主之家' })).toBeInTheDocument()
    })

    it('shows the not-found view for a missing article slug', async () => {
      render(<App initialCategories={routingCategories} initialPosts={routingPosts} />)
      await userEvent.click(screen.getByRole('link', { name: /失踪文章/ }))

      expect(screen.getByRole('heading', { name: '文章不存在' })).toBeInTheDocument()
    })
  })
})
