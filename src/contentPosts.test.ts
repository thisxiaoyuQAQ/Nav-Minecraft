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
      for (const entry of category.links) {
        const links = entry.type === 'group' ? entry.links : [entry]
        for (const link of links) {
          if (link.url.startsWith('/posts/')) {
            const slug = link.url.slice('/posts/'.length)
            expect(slugs.has(slug), `missing post for ${link.url}`).toBe(true)
          }
        }
      }
    }
  })
})
