import { describe, expect, it } from 'vitest'
import { countCategoryLinks, countEntriesLinks, filterCategories, parseMarkdownCategory } from './parseMarkdownNav'

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
          type: 'link',
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

  it('parses mixed ordinary links and second-level groups in Markdown order', () => {
    const markdown = `---
id: server-core
name: 服务端核心
icon: 🧱
description: 核心入口。
links:
  - title: Paper
    url: https://papermc.io/downloads/paper
    description: Bukkit 服务端核心。
    tags: [server, paper]
  - group: Mod服核心
    links:
      - title: Forge
        url: https://files.minecraftforge.net/net/minecraftforge/forge/
        tags: [modding, forge]
      - title: Fabric
        url: https://fabricmc.net/use/server/
        description: Fabric 服务端。
        icon: 🧵
        tags: [modding, fabric]
  - title: Velocity
    url: https://papermc.io/software/velocity
    description: 代理端。
    tags: [proxy]
---
`

    expect(parseMarkdownCategory(markdown, 'fallback').links).toEqual([
      {
        type: 'link',
        title: 'Paper',
        url: 'https://papermc.io/downloads/paper',
        description: 'Bukkit 服务端核心。',
        tags: ['server', 'paper']
      },
      {
        type: 'group',
        name: 'Mod服核心',
        links: [
          {
            type: 'link',
            title: 'Forge',
            url: 'https://files.minecraftforge.net/net/minecraftforge/forge/',
            description: '访问 Forge 相关页面。',
            tags: ['modding', 'forge']
          },
          {
            type: 'link',
            title: 'Fabric',
            url: 'https://fabricmc.net/use/server/',
            description: 'Fabric 服务端。',
            icon: '🧵',
            tags: ['modding', 'fabric']
          }
        ]
      },
      {
        type: 'link',
        title: 'Velocity',
        url: 'https://papermc.io/software/velocity',
        description: '代理端。',
        tags: ['proxy']
      }
    ])
  })

  it('counts actual resource links across ordinary entries and groups', () => {
    const category = parseMarkdownCategory(`---
name: 计数
links:
  - title: A
    url: https://example.com/a
  - group: G
    links:
      - title: B
        url: https://example.com/b
      - title: C
        url: https://example.com/c
  - title: D
    url: https://example.com/d
---
`, 'counting')

    expect(countEntriesLinks(category.links)).toBe(4)
    expect(countCategoryLinks(category)).toBe(4)
  })

  it('throws with field paths for invalid group structures', () => {
    expect(() => parseMarkdownCategory(`---
name: Broken
links:
  - group: ""
    links: []
---
`, 'broken')).toThrow('Markdown category broken is missing links[0].group')

    expect(() => parseMarkdownCategory(`---
name: Broken
links:
  - group: Bad
    links: nope
---
`, 'broken')).toThrow('Markdown category broken is missing links[0].links')

    expect(() => parseMarkdownCategory(`---
name: Broken
links:
  - group: Bad
    links:
      - group: Nested
        links: []
---
`, 'broken')).toThrow('Markdown category broken does not support nested group at links[0].links[0]')
  })
})

describe('filterCategories', () => {
  const categories = [parseMarkdownCategory(`---
id: tools
name: 工具
icon: 🧰
description: 常用工具
links:
  - title: MOTD Generator
    url: https://motd.gg
    description: 生成服务器 MOTD
    tags: [motd, tool]
  - title: Paper
    url: https://papermc.io
    description: 服务端核心
    tags: [server]
---
`, 'tools')]

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

    const paperByUrl = filterCategories(categories, 'papermc.io')[0].links[0]
    const paperByDescription = filterCategories(categories, '服务端')[0].links[0]
    const motdByTag = filterCategories(categories, 'tool')[0].links[0]

    expect(paperByUrl.type === 'link' ? paperByUrl.title : '').toBe('Paper')
    expect(paperByDescription.type === 'link' ? paperByDescription.title : '').toBe('Paper')
    expect(motdByTag.type === 'link' ? motdByTag.title : '').toBe('MOTD Generator')
  })

  it('filters matching links inside groups while preserving group titles', () => {
    const groupedCategories = [parseMarkdownCategory(`---
id: tools
name: 工具
icon: 🧰
description: 常用工具
links:
  - title: MOTD Generator
    url: https://motd.gg
    description: 生成服务器 MOTD
    tags: [motd, tool]
  - group: 服务端核心
    links:
      - title: Paper
        url: https://papermc.io
        description: 服务端核心
        tags: [server]
      - title: Fabric
        url: https://fabricmc.net/use/server/
        description: Fabric 服务端
        tags: [modding]
---
`, 'tools')]

    expect(filterCategories(groupedCategories, 'paper')).toEqual([
      {
        ...groupedCategories[0],
        links: [
          {
            type: 'group',
            name: '服务端核心',
            links: [groupedCategories[0].links[1].type === 'group' ? groupedCategories[0].links[1].links[0] : undefined]
          }
        ]
      }
    ])
  })

  it('does not match group names as search terms', () => {
    const groupedCategories = [parseMarkdownCategory(`---
name: 工具
links:
  - group: 服务端核心
    links:
      - title: Paper
        url: https://papermc.io
        description: Paper docs
        tags: [paper]
---
`, 'tools')]

    expect(filterCategories(groupedCategories, '服务端核心')).toEqual([])
  })
})
