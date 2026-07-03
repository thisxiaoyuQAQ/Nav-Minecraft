import { Fragment, type CSSProperties, type ReactNode } from 'react'

type Block =
  | { type: 'heading'; level: 1 | 2 | 3; text: string }
  | { type: 'paragraph'; text: string }
  | { type: 'list'; ordered: boolean; items: string[] }
  | { type: 'blockquote'; text: string }
  | { type: 'code'; text: string }

export function renderMarkdown(body: string, onNavigate?: (path: string) => void): ReactNode {
  const source = body.replace(/\r\n/g, '\n')
  const blocks = parseBlocks(source)
  return blocks.map((block, index) => (
    <Fragment key={index}>{renderBlock(block, onNavigate)}</Fragment>
  ))
}

function parseBlocks(source: string): Block[] {
  const lines = source.split('\n')
  const blocks: Block[] = []
  let i = 0

  while (i < lines.length) {
    const line = lines[i]

    if (line.trim() === '') {
      i++
      continue
    }

    if (line.startsWith('```')) {
      const codeLines: string[] = []
      i++
      while (i < lines.length && !lines[i].startsWith('```')) {
        codeLines.push(lines[i])
        i++
      }
      i++
      blocks.push({ type: 'code', text: codeLines.join('\n') })
      continue
    }

    const heading = line.match(/^(#{1,3})\s+(.+?)\s*$/)
    if (heading) {
      blocks.push({ type: 'heading', level: heading[1].length as 1 | 2 | 3, text: heading[2] })
      i++
      continue
    }

    if (line.startsWith('> ')) {
      const quoteLines: string[] = []
      while (i < lines.length && lines[i].startsWith('> ')) {
        quoteLines.push(lines[i].slice(2))
        i++
      }
      blocks.push({ type: 'blockquote', text: quoteLines.join(' ') })
      continue
    }

    if (/^[-*]\s+/.test(line)) {
      const items: string[] = []
      while (i < lines.length && /^[-*]\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^[-*]\s+/, ''))
        i++
      }
      blocks.push({ type: 'list', ordered: false, items })
      continue
    }

    if (/^\d+\.\s+/.test(line)) {
      const items: string[] = []
      while (i < lines.length && /^\d+\.\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^\d+\.\s+/, ''))
        i++
      }
      blocks.push({ type: 'list', ordered: true, items })
      continue
    }

    const paragraphLines: string[] = []
    while (i < lines.length && lines[i].trim() !== '' && !isBlockStart(lines[i])) {
      paragraphLines.push(lines[i].trim())
      i++
    }
    blocks.push({ type: 'paragraph', text: paragraphLines.join(' ') })
  }

  return blocks
}

function isBlockStart(line: string): boolean {
  return (
    line.startsWith('```') ||
    /^#{1,3}\s+/.test(line) ||
    line.startsWith('> ') ||
    /^[-*]\s+/.test(line) ||
    /^\d+\.\s+/.test(line)
  )
}

function renderBlock(block: Block, onNavigate?: (path: string) => void): ReactNode {
  switch (block.type) {
    case 'heading': {
      const Tag = (`h${block.level}` as 'h1' | 'h2' | 'h3')
      return <Tag>{renderInline(block.text, onNavigate)}</Tag>
    }
    case 'paragraph':
      return <p>{renderInline(block.text, onNavigate)}</p>
    case 'list':
      return block.ordered ? (
        <ol>{block.items.map((item, index) => <li key={index}>{renderInline(item, onNavigate)}</li>)}</ol>
      ) : (
        <ul>{block.items.map((item, index) => <li key={index}>{renderInline(item, onNavigate)}</li>)}</ul>
      )
    case 'blockquote':
      return <blockquote>{renderInline(block.text, onNavigate)}</blockquote>
    case 'code':
      return <pre><code>{block.text}</code></pre>
  }
}

function renderInline(text: string, onNavigate?: (path: string) => void): ReactNode[] {
  const nodes: ReactNode[] = []
  let buffer = ''
  let i = 0
  let key = 0

  const flush = () => {
    if (buffer) {
      nodes.push(buffer)
      buffer = ''
    }
  }

  while (i < text.length) {
    if (text.startsWith('**', i)) {
      const end = text.indexOf('**', i + 2)
      if (end !== -1) {
        flush()
        nodes.push(<strong key={key++}>{text.slice(i + 2, end)}</strong>)
        i = end + 2
        continue
      }
    }

    if (text[i] === '*') {
      const end = text.indexOf('*', i + 1)
      if (end !== -1) {
        flush()
        nodes.push(<em key={key++}>{text.slice(i + 1, end)}</em>)
        i = end + 1
        continue
      }
    }

    if (text[i] === '`') {
      const end = text.indexOf('`', i + 1)
      if (end !== -1) {
        flush()
        nodes.push(<code key={key++}>{text.slice(i + 1, end)}</code>)
        i = end + 1
        continue
      }
    }

    if (text[i] === '!' && text[i + 1] === '[') {
      const close = text.indexOf(']', i + 2)
      if (close !== -1 && text[close + 1] === '(') {
        const end = text.indexOf(')', close + 2)
        if (end !== -1) {
          flush()
          const alt = text.slice(i + 2, close)
          const inner = text.slice(close + 2, end).trim()
          const image = parseImage(inner)
          if (image) {
            nodes.push(<img key={key++} src={image.url} alt={alt} style={image.style} />)
          } else {
            nodes.push(alt)
          }
          i = end + 1
          continue
        }
      }
    }

    if (text[i] === '[') {
      const close = text.indexOf(']', i + 1)
      if (close !== -1 && text[close + 1] === '(') {
        const end = text.indexOf(')', close + 2)
        if (end !== -1) {
          flush()
          const label = text.slice(i + 1, close)
          const url = text.slice(close + 2, end)
          const isRootedInternal = url.startsWith('/')

          if (!isAllowedUrl(url)) {
            nodes.push(label)
          } else if (isRootedInternal && onNavigate) {
            nodes.push(
              <a
                key={key++}
                href={url}
                onClick={(event) => {
                  event.preventDefault()
                  onNavigate(url)
                }}
              >
                {label}
              </a>
            )
          } else if (/^https?:/i.test(url)) {
            nodes.push(
              <a key={key++} href={url} target="_blank" rel="noreferrer">
                {label}
              </a>
            )
          } else {
            nodes.push(<a key={key++} href={url}>{label}</a>)
          }

          i = end + 1
          continue
        }
      }
    }

    buffer += text[i]
    i++
  }

  flush()
  return nodes
}

function isAllowedUrl(url: string): boolean {
  return (
    url.startsWith('/') ||
    /^https?:/i.test(url) ||
    /^mailto:/i.test(url) ||
    url.startsWith('#') ||
    url.startsWith('./') ||
    url.startsWith('../')
  )
}

interface ImageSpec {
  url: string
  style?: CSSProperties
}

function parseImage(inner: string): ImageSpec | null {
  const parts = inner.split(/\s+/)
  const url = parts[0]
  if (!url || !isAllowedUrl(url)) {
    return null
  }

  const style = parts.length > 1 ? parseImageSize(parts.slice(1).join(' ')) : undefined
  return { url, style }
}

function parseImageSize(spec: string): CSSProperties | undefined {
  if (!spec.startsWith('=')) {
    return undefined
  }

  const value = spec.slice(1).trim()

  const widthHeight = value.match(/^(\d+)x(\d+)$/)
  if (widthHeight) {
    return { width: `${widthHeight[1]}px`, height: `${widthHeight[2]}px` }
  }

  const percent = value.match(/^(\d+)%$/)
  if (percent) {
    return { width: `${percent[1]}%`, height: 'auto' }
  }

  const width = value.match(/^(\d+)$/)
  if (width) {
    return { width: `${width[1]}px`, height: 'auto' }
  }

  return undefined
}
