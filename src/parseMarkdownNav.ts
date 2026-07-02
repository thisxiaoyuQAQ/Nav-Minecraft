import YAML from 'yaml'
import type { NavCategory, NavLink } from './navTypes'

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
    links: parseLinks(raw.links, fallbackId)
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
      links: category.links.filter((link) => linkMatches(link, normalizedQuery))
    }))
    .filter((category) => category.links.length > 0)
}

function parseLinks(value: unknown, fallbackId: string): NavLink[] {
  if (!Array.isArray(value)) {
    return []
  }

  return value.map((link, index) => {
    const raw = link as RawLink
    const title = requiredString(raw.title, fallbackId, `links[${index}].title`)

    return {
      title,
      url: requiredString(raw.url, fallbackId, `links[${index}].url`),
      description: stringOrDefault(raw.description, `访问 ${title} 相关页面。`),
      icon: typeof raw.icon === 'string' && raw.icon.trim() ? raw.icon.trim() : undefined,
      tags: parseTags(raw.tags)
    }
  })
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
