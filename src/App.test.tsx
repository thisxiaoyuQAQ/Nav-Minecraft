import { fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { App } from './App'
import type { NavCategory } from './navTypes'

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
    expect(brandIcon).toHaveAttribute('src', '/logo.png')
    expect(brandIcon).toHaveAttribute('alt', 'MCNAV logo')
    expect(container.querySelector('.topbar-copy')).toBeInTheDocument()
    expect(container.querySelector('.topbar-stat')).toHaveTextContent('1 个分类 · 3 个资源入口')
    expect(container.querySelector('.hero-glow')).toBeInTheDocument()
    expect(container.querySelector('.hero-block-field')).toBeInTheDocument()
    expect(container.querySelectorAll('.hero-block')).toHaveLength(14)
    expect(container.querySelector('.search-meta')).toHaveTextContent('共收录 3 个资源入口')
  })

  it('does not render old product or management entry points', () => {
    render(<App initialCategories={categories} />)

    expect(screen.queryByText('TwoNav')).not.toBeInTheDocument()
    expect(screen.queryByText('管理记录')).not.toBeInTheDocument()
    expect(screen.queryByText('系统管理')).not.toBeInTheDocument()
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

    expect(screen.getAllByAltText('')[0]).toHaveAttribute(
      'src',
      'https://www.google.com/s2/favicons?domain=modrinth.com&sz=64'
    )
  })

  it('falls back to a text icon when the favicon fails to load', () => {
    render(<App initialCategories={categories} />)

    const image = screen.getAllByAltText('')[0]
    fireEvent.error(image)

    expect(within(screen.getByRole('link', { name: /Modrinth/ })).getByText('M')).toBeInTheDocument()
  })
})
