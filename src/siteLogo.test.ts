// @vitest-environment node
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const indexHtml = readFileSync(new URL('../index.html', import.meta.url), 'utf8')

describe('site logo', () => {
  it('uses the public logo as the browser favicon', () => {
    expect(indexHtml).toContain('<link rel="icon" type="image/gif" href="/Nether_Star.gif" />')
  })
})
