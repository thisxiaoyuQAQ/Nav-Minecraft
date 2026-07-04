import { afterEach, describe, expect, it, vi } from 'vitest'
import { trackPageView } from './analytics'

describe('trackPageView', () => {
  afterEach(() => {
    delete window.gtag
  })

  it('is a no-op when gtag is not loaded yet', () => {
    delete window.gtag
    expect(() => trackPageView('/')).not.toThrow()
  })

  it('sends a page_view event with the path and current title', () => {
    const gtag = vi.fn()
    window.gtag = gtag
    document.title = '测试标题'

    trackPageView('/posts/server-core-guide')

    expect(gtag).toHaveBeenCalledTimes(1)
    expect(gtag).toHaveBeenCalledWith('event', 'page_view', {
      page_path: '/posts/server-core-guide',
      page_title: '测试标题'
    })
  })
})
