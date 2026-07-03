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
