import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
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
  })
})
