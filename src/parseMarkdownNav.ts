import YAML from 'yaml'
import type { NavCategory, NavEntry, NavGroup, NavLink } from './navTypes'

interface RawCategory {
  id?: unknown
  name?: unknown
  icon?: unknown
  description?: unknown
  links?: unknown
}

interface RawLink {
  title?: unknown
  url?: unknown
  description?: unknown
  icon?: unknown
  tags?: unknown
  group?: unknown
  links?: unknown
}

export function parseMarkdownCategory(markdown: string, fallbackId: string): NavCategory {
  const frontmatter = markdown.match(/^---\s*\n([\s\S]*?)\n---/)

  if (!frontmatter) {
    throw new Error(`Markdown category ${fallbackId} is missing frontmatter`)
  }

  const raw = YAML.parse(frontmatter[1]) as RawCategory | null

  if (!raw || typeof raw !== 'object') {
    throw new Error(`Markdown category ${fallbackId} has invalid frontmatter`)
  }

  return {
    id: stringOrDefault(raw.id, fallbackId),
    name: requiredString(raw.name, fallbackId, 'name'),
    icon: stringOrDefault(raw.icon, '▫️'),
    description: stringOrDefault(raw.description, ''),
    links: parseEntries(raw.links, fallbackId)
  }
}

export function filterCategories(categories: NavCategory[], query: string): NavCategory[] {
  const normalizedQuery = query.trim().toLocaleLowerCase()

  if (!normalizedQuery) {
    return categories
  }

  return categories
    .map((category) => ({
      ...category,
      links: filterEntries(category.links, normalizedQuery)
    }))
    .filter((category) => countCategoryLinks(category) > 0)
}

export function countCategoryLinks(category: NavCategory): number {
  return countEntriesLinks(category.links)
}

export function countEntriesLinks(entries: NavEntry[]): number {
  return entries.reduce((sum, entry) => sum + (entry.type === 'group' ? entry.links.length : 1), 0)
}

function parseEntries(value: unknown, fallbackId: string): NavEntry[] {
  if (!Array.isArray(value)) {
    return []
  }

  return value.map((entry, index) => parseEntry(entry, fallbackId, `links[${index}]`))
}

function parseEntry(value: unknown, fallbackId: string, path: string): NavEntry {
  const raw = asRawLink(value)

  if ('group' in raw) {
    return parseGroup(raw, fallbackId, path)
  }

  return parseLink(raw, fallbackId, path)
}

function parseGroup(raw: RawLink, fallbackId: string, path: string): NavGroup {
  const name = requiredString(raw.group, fallbackId, `${path}.group`)

  if (!Array.isArray(raw.links)) {
    throw new Error(`Markdown category ${fallbackId} is missing ${path}.links`)
  }

  return {
    type: 'group',
    name,
    links: raw.links.map((link, index) => {
      const childPath = `${path}.links[${index}]`
      const child = asRawLink(link)

      if ('group' in child) {
        throw new Error(`Markdown category ${fallbackId} does not support nested group at ${childPath}`)
      }

      return parseLink(child, fallbackId, childPath)
    })
  }
}

function parseLink(raw: RawLink, fallbackId: string, path: string): NavLink {
  const title = requiredString(raw.title, fallbackId, `${path}.title`)

  return {
    type: 'link',
    title,
    url: requiredString(raw.url, fallbackId, `${path}.url`),
    description: stringOrDefault(raw.description, `访问 ${title} 相关页面。`),
    icon: typeof raw.icon === 'string' && raw.icon.trim() ? raw.icon.trim() : undefined,
    tags: parseTags(raw.tags)
  }
}

function filterEntries(entries: NavEntry[], query: string): NavEntry[] {
  return entries.flatMap((entry): NavEntry[] => {
    if (entry.type === 'link') {
      return linkMatches(entry, query) ? [entry] : []
    }

    const links = entry.links.filter((link) => linkMatches(link, query))
    return links.length > 0 ? [{ ...entry, links }] : []
  })
}

function asRawLink(value: unknown): RawLink {
  return value && typeof value === 'object' ? value as RawLink : {}
}

function parseTags(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return []
  }

  return value.filter((tag): tag is string => typeof tag === 'string').map((tag) => tag.trim()).filter(Boolean)
}

function linkMatches(link: NavLink, query: string): boolean {
  return [link.title, link.description, link.url, ...link.tags]
    .some((field) => field.toLocaleLowerCase().includes(query))
}

function requiredString(value: unknown, fallbackId: string, field: string): string {
  if (typeof value !== 'string' || !value.trim()) {
    throw new Error(`Markdown category ${fallbackId} is missing ${field}`)
  }

  return value.trim()
}

function stringOrDefault(value: unknown, fallback: string): string {
  return typeof value === 'string' && value.trim() ? value.trim() : fallback
}
