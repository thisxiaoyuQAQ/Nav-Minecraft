import { describe, expect, it } from 'vitest'
import { filterCategories, parseMarkdownCategory } from './parseMarkdownNav'

describe('parseMarkdownCategory', () => {
  it('parses category frontmatter into navigation data', () => {
    const markdown = `---
id: server-core
name: 服务端核心
icon: 🧱
description: Paper、Folia、Velocity 等服务端核心入口。
links:
  - title: Paper
    url: https://papermc.io/downloads/paper
    description: 高性能 Minecraft 服务端核心。
    tags: [server, core, paper]
---
维护备注不参与渲染。
`

    expect(parseMarkdownCategory(markdown, 'fallback')).toEqual({
      id: 'server-core',
      name: '服务端核心',
      icon: '🧱',
      description: 'Paper、Folia、Velocity 等服务端核心入口。',
      links: [
        {
          title: 'Paper',
          url: 'https://papermc.io/downloads/paper',
          description: '高性能 Minecraft 服务端核心。',
          tags: ['server', 'core', 'paper']
        }
      ]
    })
  })

  it('uses the fallback id when frontmatter does not define id', () => {
    const markdown = `---
name: 工具
icon: 🧰
description: 常用工具。
links: []
---
`

    expect(parseMarkdownCategory(markdown, '07-tools').id).toBe('07-tools')
  })

  it('throws when Markdown does not contain frontmatter', () => {
    expect(() => parseMarkdownCategory('# no frontmatter', 'broken')).toThrow('frontmatter')
  })
})

describe('filterCategories', () => {
  const categories = [
    {
      id: 'tools',
      name: '工具',
      icon: '🧰',
      description: '常用工具',
      links: [
        { title: 'MOTD Generator', url: 'https://motd.gg', description: '生成服务器 MOTD', tags: ['motd', 'tool'] },
        { title: 'Paper', url: 'https://papermc.io', description: '服务端核心', tags: ['server'] }
      ]
    }
  ]

  it('returns all categories for empty search text', () => {
    expect(filterCategories(categories, '')).toEqual(categories)
  })

  it('keeps category structure and filters links by title, description, url, and tags', () => {
    expect(filterCategories(categories, 'motd')).toEqual([
      {
        ...categories[0],
        links: [categories[0].links[0]]
      }
    ])

    expect(filterCategories(categories, 'papermc.io')[0].links[0].title).toBe('Paper')
    expect(filterCategories(categories, '服务端')[0].links[0].title).toBe('Paper')
    expect(filterCategories(categories, 'tool')[0].links[0].title).toBe('MOTD Generator')
  })
})
