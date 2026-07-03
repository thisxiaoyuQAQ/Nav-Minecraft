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
