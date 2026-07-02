import { describe, expect, it, vi } from 'vitest'
import { applyTheme, getStoredTheme, getSystemTheme, getNextTheme, resolveTheme, saveTheme } from './theme'

describe('theme helpers', () => {
  it('reads only supported stored theme values', () => {
    const storage = makeStorage({ mcnavTheme: 'dark' })

    expect(getStoredTheme(storage)).toBe('dark')

    storage.setItem('mcnavTheme', 'blue')
    expect(getStoredTheme(storage)).toBeNull()
  })

  it('defaults to system mode when no supported stored theme exists', () => {
    expect(getStoredTheme(makeStorage())).toBeNull()
  })

  it('resolves system mode from the current preference', () => {
    expect(resolveTheme('system', true)).toBe('dark')
    expect(resolveTheme('system', false)).toBe('light')
    expect(resolveTheme('light', true)).toBe('light')
  })

  it('cycles system to light to dark and back to system', () => {
    expect(getNextTheme('system')).toBe('light')
    expect(getNextTheme('light')).toBe('dark')
    expect(getNextTheme('dark')).toBe('system')
  })

  it('saves the selected theme when storage is available', () => {
    const storage = makeStorage()

    saveTheme(storage, 'dark')

    expect(storage.getItem('mcnavTheme')).toBe('dark')
  })

  it('ignores storage errors so theme switching still works in the current session', () => {
    const storage = {
      getItem: vi.fn(() => { throw new Error('blocked') }),
      setItem: vi.fn(() => { throw new Error('blocked') }),
      removeItem: vi.fn(),
      clear: vi.fn(),
      key: vi.fn(),
      length: 0
    } satisfies Storage

    expect(getStoredTheme(storage)).toBeNull()
    expect(() => saveTheme(storage, 'light')).not.toThrow()
  })

  it('writes the selected mode and resolved theme to the root attributes', () => {
    const root = document.createElement('html')

    applyTheme('system', 'dark', root)

    expect(root.dataset.themeMode).toBe('system')
    expect(root.dataset.theme).toBe('dark')
  })

  it('reads system theme from media query matches', () => {
    expect(getSystemTheme(true)).toBe('dark')
    expect(getSystemTheme(false)).toBe('light')
  })
})

function makeStorage(initial: Record<string, string> = {}): Storage {
  let store = { ...initial }

  return {
    get length() {
      return Object.keys(store).length
    },
    clear: vi.fn(() => {
      store = {}
    }),
    getItem: vi.fn((key: string) => store[key] ?? null),
    key: vi.fn((index: number) => Object.keys(store)[index] ?? null),
    removeItem: vi.fn((key: string) => {
      delete store[key]
    }),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value
    })
  } satisfies Storage
}
