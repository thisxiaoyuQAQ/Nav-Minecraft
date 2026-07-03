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
