import { describe, expect, it } from 'vitest'
import { getFallbackIconLabel, getFaviconUrl } from './linkIcons'

describe('link icon helpers', () => {
  it('builds a favicon URL from a normal website URL', () => {
    expect(getFaviconUrl('https://papermc.io/downloads/paper')).toBe(
      'https://www.google.com/s2/favicons?domain=papermc.io&sz=64'
    )
  })

  it('returns undefined for invalid or placeholder URLs', () => {
    expect(getFaviconUrl('#')).toBeUndefined()
    expect(getFaviconUrl('not a url')).toBeUndefined()
  })

  it('uses the first visible character as the fallback icon label', () => {
    expect(getFallbackIconLabel('  Paper  ')).toBe('P')
    expect(getFallbackIconLabel('粘液科技')).toBe('粘')
  })

  it('uses the category icon when the title is empty', () => {
    expect(getFallbackIconLabel('   ', '📚')).toBe('📚')
  })
})
