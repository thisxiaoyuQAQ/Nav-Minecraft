import { describe, expect, it } from 'vitest'
import { categories } from './navData'

describe('content categories', () => {
  it('loads active Markdown categories with unique ids and usable links', () => {
    expect(categories.length).toBeGreaterThan(0)
    expect(categories.map((category) => category.name)).not.toContain('最近热门')

    const ids = new Set<string>()

    for (const category of categories) {
      expect(category.id).toMatch(/^[a-z0-9-]+$/)
      expect(ids.has(category.id)).toBe(false)
      ids.add(category.id)
      expect(category.name.trim()).not.toBe('')
      expect(category.description).not.toMatch(/TwoNav|自动导入|由.*导入/)

      for (const link of category.links) {
        expect(link.title.trim()).not.toBe('')
        expect(link.url).toMatch(/^https?:\/\/|^\/posts\//)
        expect(link.description).not.toMatch(/TwoNav|自动导入|由.*导入/)
        expect(Array.isArray(link.tags)).toBe(true)
      }
    }
  })
})
