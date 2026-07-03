import { fireEvent, render } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { renderMarkdown } from './markdown'

function containerFor(body: string) {
  return render(<div>{renderMarkdown(body)}</div>).container
}

describe('renderMarkdown', () => {
  it('renders h1, h2, h3 headings', () => {
    const container = containerFor('# A\n## B\n### C')
    expect(container.querySelector('h1')?.textContent).toBe('A')
    expect(container.querySelector('h2')?.textContent).toBe('B')
    expect(container.querySelector('h3')?.textContent).toBe('C')
  })

  it('renders paragraphs', () => {
    const container = containerFor('第一段。\n\n第二段。')
    expect(container.querySelectorAll('p')).toHaveLength(2)
  })

  it('renders bold, italic, and inline code', () => {
    const container = containerFor('**粗体** *斜体* `code`')
    expect(container.querySelector('strong')?.textContent).toBe('粗体')
    expect(container.querySelector('em')?.textContent).toBe('斜体')
    expect(container.querySelector('code')?.textContent).toBe('code')
  })

  it('renders unordered and ordered lists', () => {
    const container = containerFor('- a\n- b\n\n1. x\n2. y')
    expect(container.querySelectorAll('ul li')).toHaveLength(2)
    expect(container.querySelectorAll('ol li')).toHaveLength(2)
  })

  it('renders blockquotes', () => {
    const container = containerFor('> 引用内容')
    expect(container.querySelector('blockquote')?.textContent).toBe('引用内容')
  })

  it('renders fenced code blocks', () => {
    const container = containerFor('```\nconsole.log(1)\n```')
    const pre = container.querySelector('pre')
    expect(pre).not.toBeNull()
    expect(pre?.querySelector('code')?.textContent).toBe('console.log(1)')
  })

  it('renders links', () => {
    const container = containerFor('[文本](https://example.com)')
    const link = container.querySelector('a')
    expect(link?.textContent).toBe('文本')
    expect(link?.getAttribute('href')).toBe('https://example.com')
    expect(link?.getAttribute('target')).toBe('_blank')
    expect(link?.getAttribute('rel')).toBe('noreferrer')
  })

  it('renders no anchor for dangerous schemes', () => {
    const container = containerFor('[x](javascript:alert(1))')
    expect(container.querySelector('a')).toBeNull()
    expect(container.textContent).toContain('x')
  })

  it('intercepts in-article internal links via onNavigate', () => {
    const mockNavigate = vi.fn()
    const { container } = render(<div>{renderMarkdown('[指南](/posts/welcome)', mockNavigate)}</div>)
    const link = container.querySelector('a')
    expect(link?.getAttribute('href')).toBe('/posts/welcome')

    fireEvent.click(link!)
    expect(mockNavigate).toHaveBeenCalledWith('/posts/welcome')
  })

  it('renders an image with alt and src', () => {
    const container = containerFor('![logo](/Nether_Star.gif)')
    const img = container.querySelector('img')
    expect(img).not.toBeNull()
    expect(img?.getAttribute('src')).toBe('/Nether_Star.gif')
    expect(img?.getAttribute('alt')).toBe('logo')
  })

  it('renders a proportional image width via =W', () => {
    const container = containerFor('![logo](/x.png =300)')
    const img = container.querySelector('img')
    expect(img?.style.width).toBe('300px')
    expect(img?.style.height).toBe('auto')
  })

  it('renders a percentage image width', () => {
    const container = containerFor('![logo](/x.png =50%)')
    const img = container.querySelector('img')
    expect(img?.style.width).toBe('50%')
    expect(img?.style.height).toBe('auto')
  })

  it('renders an explicit image width and height', () => {
    const container = containerFor('![logo](/x.png =300x200)')
    const img = container.querySelector('img')
    expect(img?.style.width).toBe('300px')
    expect(img?.style.height).toBe('200px')
  })

  it('blocks javascript: image src and renders the alt text instead', () => {
    const container = containerFor('![logo](javascript:alert(1))')
    expect(container.querySelector('img')).toBeNull()
    expect(container.textContent).toContain('logo')
  })
})
