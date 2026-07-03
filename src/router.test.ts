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
