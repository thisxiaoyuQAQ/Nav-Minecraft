# 小型文章管理系统 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a small article system so navigation cards can link to internal article pages, with articles maintained as Markdown files in `content/posts/`.

**Architecture:** At build time, `import.meta.glob` reads `content/posts/*.md` exactly like the existing category loader. A lightweight History-API router (no React Router) switches the React app between the home navigation view and a `/posts/<slug>` article view. Articles use optional frontmatter (`title`/`description`/`date`/`tags`) and a small controlled Markdown renderer.

**Tech Stack:** Vite + React + TypeScript, vitest + @testing-library/react, `yaml` package (already a dependency).

## Global Constraints

- No new npm dependencies. Use `yaml` (already in `package.json`) for frontmatter.
- No React Router. Routing uses `window.history.pushState` + `popstate`.
- Article Markdown source lives only in `content/posts/*.md`; no admin UI, no article list page.
- Internal article links are written as `/posts/<slug>` in category frontmatter.
- External links keep `target="_blank" rel="noreferrer"`; internal links open in-page.
- Article pages hide the category sidebar and reuse existing CSS variables / theme system.
- Frontmatter fields are all optional; title falls back to first H1, then slug.
- Brand copy stays `MCNAV`; existing home-page tests must keep passing.

---

### Task 1: Article post types and Markdown parser

**Files:**
- Create: `src/postTypes.ts`
- Create: `src/parseMarkdownPost.ts`
- Create: `src/parseMarkdownPost.test.ts`

**Interfaces:**
- Consumes: `yaml` package default export.
- Produces: `ArticlePost` type (`postTypes.ts`) and `parseMarkdownPost(markdown: string, slug: string): ArticlePost` (`parseMarkdownPost.ts`). Later tasks import `ArticlePost` from `./postTypes`.

- [ ] **Step 1: Write the failing test**

Create `src/parseMarkdownPost.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { parseMarkdownPost } from './parseMarkdownPost'

describe('parseMarkdownPost', () => {
  it('parses frontmatter and body', () => {
    const md = `---
title: 我的服务端指南
description: 选择核心。
date: 2026-07-03
tags: [server, guide]
---

## 正文

内容。`

    expect(parseMarkdownPost(md, 'guide')).toEqual({
      slug: 'guide',
      title: '我的服务端指南',
      description: '选择核心。',
      date: '2026-07-03',
      tags: ['server', 'guide'],
      body: '## 正文\n\n内容。'
    })
  })

  it('uses the first H1 as title when frontmatter title is missing and strips that line from body', () => {
    const md = `## 副标题

# 标题

正文。`

    const post = parseMarkdownPost(md, 'fallback')
    expect(post.title).toBe('标题')
    expect(post.body).not.toContain('# 标题')
    expect(post.body).toContain('## 副标题')
  })

  it('falls back to slug when no title and no H1', () => {
    expect(parseMarkdownPost('正文内容。', 'no-title').title).toBe('no-title')
  })

  it('parses without frontmatter', () => {
    const post = parseMarkdownPost('正文。', 'plain')
    expect(post.title).toBe('plain')
    expect(post.body).toBe('正文。')
  })

  it('throws when frontmatter parses to a non-object value', () => {
    const md = `---
hello world
---
正文`
    expect(() => parseMarkdownPost(md, 'bad')).toThrow('invalid frontmatter')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- --run src/parseMarkdownPost.test.ts`
Expected: FAIL — `parseMarkdownPost` is not defined / module not found.

- [ ] **Step 3: Write minimal implementation**

Create `src/postTypes.ts`:

```ts
export interface ArticlePost {
  slug: string
  title: string
  description?: string
  date?: string
  tags: string[]
  body: string
}
```

Create `src/parseMarkdownPost.ts`:

```ts
import YAML from 'yaml'
import type { ArticlePost } from './postTypes'

interface RawPost {
  title?: unknown
  description?: unknown
  date?: unknown
  tags?: unknown
}

export function parseMarkdownPost(markdown: string, slug: string): ArticlePost {
  const normalized = markdown.replace(/\r\n/g, '\n')
  const match = normalized.match(/^---\s*\n([\s\S]*?)\n---\s*\n?([\s\S]*)$/)

  let raw: RawPost = {}
  let body = normalized

  if (match) {
    let parsed: unknown
    try {
      parsed = YAML.parse(match[1])
    } catch (error) {
      throw new Error(`Post ${slug} has invalid frontmatter: ${(error as Error).message}`)
    }

    if (parsed === null) {
      raw = {}
    } else if (typeof parsed === 'object') {
      raw = parsed as RawPost
    } else {
      throw new Error(`Post ${slug} has invalid frontmatter`)
    }

    body = match[2]
  }

  let title = stringOrUndefined(raw.title)
  let workingBody = body

  if (!title) {
    const heading = workingBody.match(/^#\s+(.+?)\s*$/m)
    if (heading) {
      title = heading[1].trim()
      workingBody = workingBody.replace(heading[0], '')
    }
  }

  if (!title) {
    title = slug
  }

  return {
    slug,
    title,
    description: stringOrUndefined(raw.description),
    date: stringOrUndefined(raw.date),
    tags: parseTags(raw.tags),
    body: workingBody.trim()
  }
}

function stringOrUndefined(value: unknown): string | undefined {
  if (typeof value !== 'string') {
    return undefined
  }
  const trimmed = value.trim()
  return trimmed ? trimmed : undefined
}

function parseTags(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return []
  }
  return value
    .filter((tag): tag is string => typeof tag === 'string')
    .map((tag) => tag.trim())
    .filter(Boolean)
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test -- --run src/parseMarkdownPost.test.ts`
Expected: PASS (5 tests).

- [ ] **Step 5: Commit**

```bash
git add src/postTypes.ts src/parseMarkdownPost.ts src/parseMarkdownPost.test.ts
git commit -m "feat: add article post markdown parser"
```

---

### Task 2: Lightweight Markdown renderer

**Files:**
- Create: `src/markdown.tsx`
- Create: `src/markdown.test.tsx`

**Interfaces:**
- Consumes: React JSX runtime (vite plugin, no React import needed).
- Produces: `renderMarkdown(body: string): React.ReactNode` (`src/markdown.tsx`). Used by Task 5's `PostView`.

- [ ] **Step 1: Write the failing test**

Create `src/markdown.test.tsx`:

```tsx
import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { renderMarkdown } from './markdown'

function containerFor(body: string) {
  return render(<div>{renderMarkdown(body)}</div>).container
}

describe('renderMarkdown', () => {
  it('renders h1, h2, h3 headings', () => {
    const container = containerFor('# A\n## B\n### C')
    expect(container.querySelector('h1')?.textContent).toBe('A')
    expect(container.querySelector('h2')?.textContent).toBe('B')
    expect(container.querySelector('h3')?.textContent).toBe('C')
  })

  it('renders paragraphs', () => {
    const container = containerFor('第一段。\n\n第二段。')
    expect(container.querySelectorAll('p')).toHaveLength(2)
  })

  it('renders bold, italic, and inline code', () => {
    const container = containerFor('**粗体** *斜体* `code`')
    expect(container.querySelector('strong')?.textContent).toBe('粗体')
    expect(container.querySelector('em')?.textContent).toBe('斜体')
    expect(container.querySelector('code')?.textContent).toBe('code')
  })

  it('renders unordered and ordered lists', () => {
    const container = containerFor('- a\n- b\n\n1. x\n2. y')
    expect(container.querySelectorAll('ul li')).toHaveLength(2)
    expect(container.querySelectorAll('ol li')).toHaveLength(2)
  })

  it('renders blockquotes', () => {
    const container = containerFor('> 引用内容')
    expect(container.querySelector('blockquote')?.textContent).toBe('引用内容')
  })

  it('renders fenced code blocks', () => {
    const container = containerFor('```\nconsole.log(1)\n```')
    const pre = container.querySelector('pre')
    expect(pre).not.toBeNull()
    expect(pre?.querySelector('code')?.textContent).toBe('console.log(1)')
  })

  it('renders links', () => {
    const container = containerFor('[文本](https://example.com)')
    const link = container.querySelector('a')
    expect(link?.textContent).toBe('文本')
    expect(link?.getAttribute('href')).toBe('https://example.com')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- --run src/markdown.test.tsx`
Expected: FAIL — module `./markdown` not found.

- [ ] **Step 3: Write minimal implementation**

Create `src/markdown.tsx` with the full source under the heading "Full source for `src/markdown.tsx` (Task 2, Step 3)" below. The module exports `renderMarkdown(body: string): ReactNode`, which parses blocks (headings, paragraphs, lists, blockquotes, fenced code) and inline tokens (bold, italic, inline code, links) into React elements.

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test -- --run src/markdown.test.tsx`
Expected: PASS (7 tests).

- [ ] **Step 5: Commit**

```bash
git add src/markdown.tsx src/markdown.test.tsx
git commit -m "feat: add lightweight markdown renderer"
```

---

#### Full source for `src/markdown.tsx` (Task 2, Step 3)

Create `src/markdown.tsx` with this exact content:

```tsx
import { Fragment, type ReactNode } from 'react'

type Block =
  | { type: 'heading'; level: 1 | 2 | 3; text: string }
  | { type: 'paragraph'; text: string }
  | { type: 'list'; ordered: boolean; items: string[] }
  | { type: 'blockquote'; text: string }
  | { type: 'code'; text: string }

export function renderMarkdown(body: string): ReactNode {
  const source = body.replace(/\r\n/g, '\n')
  const blocks = parseBlocks(source)
  return blocks.map((block, index) => (
    <Fragment key={index}>{renderBlock(block)}</Fragment>
  ))
}

function parseBlocks(source: string): Block[] {
  const lines = source.split('\n')
  const blocks: Block[] = []
  let i = 0

  while (i < lines.length) {
    const line = lines[i]

    if (line.trim() === '') {
      i++
      continue
    }

    if (line.startsWith('```')) {
      const codeLines: string[] = []
      i++
      while (i < lines.length && !lines[i].startsWith('```')) {
        codeLines.push(lines[i])
        i++
      }
      i++
      blocks.push({ type: 'code', text: codeLines.join('\n') })
      continue
    }

    const heading = line.match(/^(#{1,3})\s+(.+?)\s*$/)
    if (heading) {
      blocks.push({ type: 'heading', level: heading[1].length as 1 | 2 | 3, text: heading[2] })
      i++
      continue
    }

    if (line.startsWith('> ')) {
      const quoteLines: string[] = []
      while (i < lines.length && lines[i].startsWith('> ')) {
        quoteLines.push(lines[i].slice(2))
        i++
      }
      blocks.push({ type: 'blockquote', text: quoteLines.join(' ') })
      continue
    }

    if (/^[-*]\s+/.test(line)) {
      const items: string[] = []
      while (i < lines.length && /^[-*]\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^[-*]\s+/, ''))
        i++
      }
      blocks.push({ type: 'list', ordered: false, items })
      continue
    }

    if (/^\d+\.\s+/.test(line)) {
      const items: string[] = []
      while (i < lines.length && /^\d+\.\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^\d+\.\s+/, ''))
        i++
      }
      blocks.push({ type: 'list', ordered: true, items })
      continue
    }

    const paragraphLines: string[] = []
    while (i < lines.length && lines[i].trim() !== '' && !isBlockStart(lines[i])) {
      paragraphLines.push(lines[i].trim())
      i++
    }
    blocks.push({ type: 'paragraph', text: paragraphLines.join(' ') })
  }

  return blocks
}

function isBlockStart(line: string): boolean {
  return (
    line.startsWith('```') ||
    /^#{1,3}\s+/.test(line) ||
    line.startsWith('> ') ||
    /^[-*]\s+/.test(line) ||
    /^\d+\.\s+/.test(line)
  )
}

function renderBlock(block: Block): ReactNode {
  switch (block.type) {
    case 'heading': {
      const Tag = (`h${block.level}` as 'h1' | 'h2' | 'h3')
      return <Tag>{renderInline(block.text)}</Tag>
    }
    case 'paragraph':
      return <p>{renderInline(block.text)}</p>
    case 'list':
      return block.ordered ? (
        <ol>{block.items.map((item, index) => <li key={index}>{renderInline(item)}</li>)}</ol>
      ) : (
        <ul>{block.items.map((item, index) => <li key={index}>{renderInline(item)}</li>)}</ul>
      )
    case 'blockquote':
      return <blockquote>{renderInline(block.text)}</blockquote>
    case 'code':
      return <pre><code>{block.text}</code></pre>
  }
}

function renderInline(text: string): ReactNode[] {
  const nodes: ReactNode[] = []
  let buffer = ''
  let i = 0
  let key = 0

  const flush = () => {
    if (buffer) {
      nodes.push(buffer)
      buffer = ''
    }
  }

  while (i < text.length) {
    if (text.startsWith('**', i)) {
      const end = text.indexOf('**', i + 2)
      if (end !== -1) {
        flush()
        nodes.push(<strong key={key++}>{text.slice(i + 2, end)}</strong>)
        i = end + 2
        continue
      }
    }

    if (text[i] === '*') {
      const end = text.indexOf('*', i + 1)
      if (end !== -1) {
        flush()
        nodes.push(<em key={key++}>{text.slice(i + 1, end)}</em>)
        i = end + 1
        continue
      }
    }

    if (text[i] === '`') {
      const end = text.indexOf('`', i + 1)
      if (end !== -1) {
        flush()
        nodes.push(<code key={key++}>{text.slice(i + 1, end)}</code>)
        i = end + 1
        continue
      }
    }

    if (text[i] === '[') {
      const close = text.indexOf(']', i + 1)
      if (close !== -1 && text[close + 1] === '(') {
        const end = text.indexOf(')', close + 2)
        if (end !== -1) {
          flush()
          const label = text.slice(i + 1, close)
          const url = text.slice(close + 2, end)
          nodes.push(<a key={key++} href={url}>{label}</a>)
          i = end + 1
          continue
        }
      }
    }

    buffer += text[i]
    i++
  }

  flush()
  return nodes
}
```

---

### Task 3: Route parser

**Files:**
- Create: `src/router.ts`
- Create: `src/router.test.ts`

**Interfaces:**
- Consumes: nothing.
- Produces: `Route` type and `parseRoute(pathname: string): Route` (`src/router.ts`). Used by Task 5's `App`.

- [ ] **Step 1: Write the failing test**

Create `src/router.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { parseRoute } from './router'

describe('parseRoute', () => {
  it('returns home for the root path', () => {
    expect(parseRoute('/')).toEqual({ name: 'home' })
    expect(parseRoute('')).toEqual({ name: 'home' })
  })

  it('returns a post route for /posts/<slug>', () => {
    expect(parseRoute('/posts/welcome')).toEqual({ name: 'post', slug: 'welcome' })
  })

  it('accepts a trailing slash on post routes', () => {
    expect(parseRoute('/posts/welcome/')).toEqual({ name: 'post', slug: 'welcome' })
  })

  it('returns not-found for an empty post slug', () => {
    expect(parseRoute('/posts/')).toEqual({ name: 'not-found' })
  })

  it('returns not-found for nested post paths', () => {
    expect(parseRoute('/posts/a/b')).toEqual({ name: 'not-found' })
  })

  it('returns not-found for unknown top-level paths', () => {
    expect(parseRoute('/random')).toEqual({ name: 'not-found' })
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- --run src/router.test.ts`
Expected: FAIL — module `./router` not found.

- [ ] **Step 3: Write minimal implementation**

Create `src/router.ts`:

```ts
export type Route =
  | { name: 'home' }
  | { name: 'post'; slug: string }
  | { name: 'not-found' }

export function parseRoute(pathname: string): Route {
  if (pathname === '/' || pathname === '') {
    return { name: 'home' }
  }

  const match = pathname.match(/^\/posts\/([^/]+)\/?$/)
  if (match) {
    return { name: 'post', slug: match[1] }
  }

  return { name: 'not-found' }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test -- --run src/router.test.ts`
Expected: PASS (6 tests).

- [ ] **Step 5: Commit**

```bash
git add src/router.ts src/router.test.ts
git commit -m "feat: add route parser"
```

---

### Task 4: Post data loader and content integration test

**Files:**
- Create: `content/posts/welcome.md`
- Create: `src/postData.ts`
- Create: `src/contentPosts.test.ts`

**Interfaces:**
- Consumes: `parseMarkdownPost` (Task 1), `ArticlePost` (Task 1), `categories` from `./navData`.
- Produces: `posts: ArticlePost[]` (`src/postData.ts`). Used by Task 5's `main.tsx` and `App`.

- [ ] **Step 1: Create the sample post**

Create `content/posts/welcome.md` (the fenced code block inside is part of the article body):

~~~markdown
---
title: 欢迎使用 MCNAV 文章系统
description: 介绍如何在 content/posts 目录维护站内文章。
date: 2026-07-03
tags: [guide, mcnav]
---

MCNAV 现在支持通过 Markdown 编写站内文章，导航卡片可以直接指向 `/posts/<slug>` 内部页面。

## 如何新增文章

在 `content/posts/` 目录新增一个 Markdown 文件，例如 `my-guide.md`，即可通过 `/posts/my-guide` 访问。

- 文件名就是文章的 slug
- frontmatter 中的 `title`、`description`、`date`、`tags` 均为可选
- 没有填写 `title` 时，会读取正文第一个 `#` 标题

## 支持的 Markdown 语法

你可以使用 **粗体**、*斜体*、`行内代码`，以及：

1. 有序列表
2. 无序列表
3. [站内链接](/) 与外部链接

> 引用块用于强调补充说明。

```ts
console.log('代码块也支持。')
```
~~~

- [ ] **Step 2: Write the failing test**

Create `src/contentPosts.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { categories } from './navData'
import { posts } from './postData'

describe('content posts', () => {
  it('parses all post markdown files into unique slugs with title and body', () => {
    expect(posts.length).toBeGreaterThan(0)

    const slugs = posts.map((post) => post.slug)
    expect(new Set(slugs).size).toBe(slugs.length)

    for (const post of posts) {
      expect(post.title.trim()).not.toBe('')
      expect(post.body.trim()).not.toBe('')
    }
  })

  it('resolves every internal /posts/ link in categories to a real post', () => {
    const slugs = new Set(posts.map((post) => post.slug))

    for (const category of categories) {
      for (const link of category.links) {
        if (link.url.startsWith('/posts/')) {
          const slug = link.url.slice('/posts/'.length)
          expect(slugs.has(slug), `missing post for ${link.url}`).toBe(true)
        }
      }
    }
  })
})
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npm run test -- --run src/contentPosts.test.ts`
Expected: FAIL — module `./postData` not found.

- [ ] **Step 4: Write minimal implementation**

Create `src/postData.ts`:

```ts
import { parseMarkdownPost } from './parseMarkdownPost'
import type { ArticlePost } from './postTypes'

const modules = import.meta.glob('../content/posts/*.md', {
  eager: true,
  query: '?raw',
  import: 'default'
}) as Record<string, string>

export const posts: ArticlePost[] = Object.entries(modules)
  .sort(([left], [right]) => left.localeCompare(right))
  .map(([path, markdown]) => parseMarkdownPost(markdown, getSlug(path)))

function getSlug(path: string): string {
  return path.split('/').pop()!.replace(/\.md$/, '')
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npm run test -- --run src/contentPosts.test.ts`
Expected: PASS (2 tests).

- [ ] **Step 6: Commit**

```bash
git add content/posts/welcome.md src/postData.ts src/contentPosts.test.ts
git commit -m "feat: load article posts from content/posts"
```

---

### Task 5: Wire routing, article view, and internal nav links into App

**Files:**
- Modify: `src/App.tsx` (full rewrite of the file shown below)
- Modify: `src/main.tsx`
- Modify: `src/App.css` (append styles)
- Modify: `src/App.test.tsx` (add a routing describe)

**Interfaces:**
- Consumes: `parseRoute` + `Route` (Task 3), `renderMarkdown` (Task 2), `ArticlePost` (Task 1), existing `navTypes`, `parseMarkdownNav`, `linkIcons`, `theme` modules.
- Produces: `App` now accepts `initialPosts?: ArticlePost[]`; internal `/posts/...` nav cards navigate in-page.

- [ ] **Step 1: Write the failing tests**

Open `src/App.test.tsx`. Update the testing-library import to include `act`, and add an `ArticlePost` type import. The top imports become:

```ts
import { act, fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { App } from './App'
import type { ArticlePost } from './postTypes'
import type { NavCategory } from './navTypes'
```

Append the following `describe('routing', ...)` block at the end of the outer `describe('App', ...)` (after the existing `it` blocks, before the closing `})`):

```tsx
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
        { title: 'Modrinth', url: 'https://modrinth.com', description: '模组平台', tags: ['mods'] },
        { title: '服务端核心选择指南', url: '/posts/server-core-guide', description: '内部文章', tags: ['guide'] },
        { title: '失踪文章', url: '/posts/missing', description: '测试 404', tags: ['test'] }
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
        window.history.back()
      })

      expect(screen.getByRole('heading', { name: '服主之家' })).toBeInTheDocument()
    })

    it('shows the not-found view for a missing article slug', async () => {
      render(<App initialCategories={routingCategories} initialPosts={routingPosts} />)
      await userEvent.click(screen.getByRole('link', { name: /失踪文章/ }))

      expect(screen.getByRole('heading', { name: '文章不存在' })).toBeInTheDocument()
    })
  })
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm run test -- --run src/App.test.tsx`
Expected: FAIL — new routing tests fail (App does not yet accept `initialPosts`, no article view, internal links still carry `target="_blank"`).

- [ ] **Step 3: Rewrite `src/App.tsx`**

Replace the entire contents of `src/App.tsx` with the full source under the heading "Full source for `src/App.tsx` (Task 5, Step 3)" below.

#### Full source for `src/App.tsx` (Task 5, Step 3)

```tsx
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
          <ThemeToggle themeMode={themeMode} onToggle={() => setThemeMode(getNextTheme(themeMode))} />
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

function getPrefersDark(): boolean {
  return typeof window !== 'undefined' && Boolean(window.matchMedia?.('(prefers-color-scheme: dark)').matches)
}
```

- [ ] **Step 4: Update `src/main.tsx`**

Replace the entire contents of `src/main.tsx` with:

```tsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './App'
import { categories } from './navData'
import { posts } from './postData'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App initialCategories={categories} initialPosts={posts} />
  </StrictMode>
)
```

- [ ] **Step 5: Append article page styles to `src/App.css`**

Append the following block to the end of `src/App.css`:

```css

.app-shell[data-layout='single-column'] {
  grid-template-columns: minmax(0, 1fr);
}

.back-button {
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

.back-button:hover,
.back-button:focus-visible {
  border-color: var(--line-strong);
  background: var(--accent-soft);
  outline: 3px solid color-mix(in srgb, var(--accent) 22%, transparent);
  transform: translateY(-1px);
}

.post-page,
.not-found {
  padding: clamp(24px, 4vw, 56px);
  border: 1px solid var(--line);
  border-radius: 32px;
  background: linear-gradient(145deg, var(--panel-strong), var(--panel));
  box-shadow: var(--card-shadow), var(--inner-highlight);
  backdrop-filter: blur(28px) saturate(150%);
}

.post-header {
  display: grid;
  gap: 14px;
  margin-bottom: 28px;
  padding-bottom: 24px;
  border-bottom: 1px solid var(--line);
}

.post-title {
  margin: 0;
  font-size: clamp(1.8rem, 4vw, 2.8rem);
  letter-spacing: -0.04em;
  line-height: 1.1;
}

.post-description {
  margin: 0;
  color: var(--muted);
  font-size: 1.05rem;
  line-height: 1.7;
}

.post-meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px;
  color: var(--muted);
  font-size: 0.9rem;
}

.post-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.post-tags li {
  padding: 4px 10px;
  border: 1px solid var(--line);
  border-radius: 999px;
  background: var(--accent-soft);
  color: var(--accent-strong);
  font-size: 0.8rem;
  font-weight: 700;
}

.post-body {
  display: grid;
  gap: 18px;
  font-size: 1.02rem;
  line-height: 1.8;
  color: var(--text);
}

.post-body h1,
.post-body h2,
.post-body h3 {
  margin: 0;
  letter-spacing: -0.02em;
  line-height: 1.25;
}

.post-body h1 { font-size: 1.8rem; }
.post-body h2 { font-size: 1.45rem; }
.post-body h3 { font-size: 1.2rem; }

.post-body p { margin: 0; }

.post-body ul,
.post-body ol {
  margin: 0;
  padding-left: 1.4em;
}

.post-body li { margin: 4px 0; }

.post-body blockquote {
  margin: 0;
  padding: 12px 18px;
  border-left: 3px solid var(--accent);
  border-radius: 0 14px 14px 0;
  background: var(--accent-soft);
  color: var(--muted);
}

.post-body code {
  padding: 2px 6px;
  border-radius: 6px;
  background: var(--bg-soft);
  font-family: ui-monospace, "SF Mono", "Cascadia Code", monospace;
  font-size: 0.92em;
}

.post-body pre {
  margin: 0;
  padding: 18px 20px;
  border: 1px solid var(--line);
  border-radius: 18px;
  background: var(--bg-soft);
  overflow-x: auto;
}

.post-body pre code {
  padding: 0;
  background: transparent;
  font-size: 0.92rem;
  line-height: 1.6;
}

.post-body a {
  color: var(--accent-strong);
  text-decoration: underline;
  text-underline-offset: 3px;
}

.not-found {
  display: grid;
  gap: 12px;
  text-align: center;
}

.not-found h1 {
  margin: 0;
  font-size: clamp(2rem, 6vw, 3.4rem);
  letter-spacing: -0.04em;
}

.not-found p {
  margin: 0;
  color: var(--muted);
}
```

- [ ] **Step 6: Run tests to verify they pass**

Run: `npm run test -- --run`
Expected: PASS — all existing App tests plus the 6 new routing tests pass. `contentCategories.test.ts` still passes because no real category contains an internal `/posts/` link yet.

- [ ] **Step 7: Verify the production build type-checks**

Run: `npm run build`
Expected: build succeeds with no TypeScript errors.

- [ ] **Step 8: Commit**

```bash
git add src/App.tsx src/main.tsx src/App.css src/App.test.tsx
git commit -m "feat: route to internal article pages from nav cards"
```

---

### Task 6: Add a real internal article link and verify the full system

**Files:**
- Modify: `content/categories/01-announcements.md`
- Modify: `src/contentCategories.test.ts`

**Interfaces:**
- Consumes: the `welcome` post created in Task 4.
- Produces: a live internal link on the home page that opens the article view.

- [ ] **Step 1: Allow internal `/posts/` URLs in the content guard**

Open `src/contentCategories.test.ts`. Inside the `for` loop over links, update the URL assertion. Change this line:

```ts
        expect(link.url).toMatch(/^https?:\/\//)
```

to:

```ts
        expect(link.url).toMatch(/^https?:\/\/|^\/posts\//)
```

- [ ] **Step 2: Add the internal article link to the announcements category**

Open `content/categories/01-announcements.md`. Add a new entry to the `links` list (after the existing three entries, before the closing `---`). The full file becomes:

```yaml
---
id: announcements
name: 站点公告
icon: 📣
description: MCNAV 站点说明、收录指南、赞助入口与交流群信息。
links:
  - title: 赞助我喵
    url: https://mcnav.cn/donate/index.html
    description: 访问 MCNAV 赞助支持页面。
    tags: [donate, support]
  - title: 点击加入官方交流群
    url: https://qm.qq.com/q/TfSecPsNic
    description: 加入 MCNAV 官方 QQ 交流群。
    tags: [qq, community, contact]
  - title: 广告
    url: https://mcnav.cn/wiki/ad/index.html
    description: 查看 MCNAV 广告位说明页面。
    tags: [ad, notice]
  - title: 文章系统使用说明
    url: /posts/welcome
    description: 了解如何在 MCNAV 维护站内文章。
    tags: [guide, post]
---
```

- [ ] **Step 3: Run the full test suite**

Run: `npm run test -- --run`
Expected: PASS — all tests pass, including `contentCategories` (now allows `/posts/`) and `contentPosts` (the new `/posts/welcome` link resolves to the `welcome` post).

- [ ] **Step 4: Run the production build**

Run: `npm run build`
Expected: build succeeds.

- [ ] **Step 5: Commit**

```bash
git add content/categories/01-announcements.md src/contentCategories.test.ts
git commit -m "feat: link announcements to the welcome article"
```

---

## Self-Review Notes

- Spec coverage: article source dir (`content/posts/*.md`) → Task 4. Optional frontmatter + title fallback → Task 1. Slug from filename + `/posts/<slug>` path → Tasks 3 and 4. Internal nav card navigation → Task 5. External links unchanged → Task 5 (`target` logic). No sidebar on article page → Task 5 (`single-column` layout). 404 for missing article → Task 5 (`NotFoundView`). Markdown subset rendering → Task 2. Tests for parser, renderer, router, App routing, content integration → Tasks 1–5. Real wired-up internal link → Task 6. All spec sections covered.
- Type consistency: `ArticlePost` fields (`slug`, `title`, `description?`, `date?`, `tags`, `body`) match across `postTypes.ts`, the parser return, `postData.ts`, and `PostView`. `Route` and `parseRoute` signatures match between `router.ts` and `App.tsx`. `renderMarkdown(body): ReactNode` matches its import in `App.tsx`.
- Existing tests stay green: home view markup, theme cycling, search filtering, favicon fallback, and the `data-layout="full-bleed"` / `topbar-stat` assertions are preserved by the `isHome` branch. `getAllByAltText('')` still returns only the external favicon images because internal `/posts/` URLs yield `getFaviconUrl === undefined` and render the fallback span instead.
