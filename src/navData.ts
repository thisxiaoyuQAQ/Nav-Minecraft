import { parseMarkdownCategory } from './parseMarkdownNav'

const modules = import.meta.glob('../content/categories/*.md', {
  eager: true,
  query: '?raw',
  import: 'default'
}) as Record<string, string>

export const categories = Object.entries(modules)
  .sort(([left], [right]) => left.localeCompare(right))
  .map(([path, markdown]) => parseMarkdownCategory(markdown, getFallbackId(path)))

function getFallbackId(path: string): string {
  return path
    .split('/')
    .pop()!
    .replace(/\.md$/, '')
    .replace(/^\d+-/, '')
}
