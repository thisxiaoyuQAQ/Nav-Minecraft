export type ThemeMode = 'system' | 'light' | 'dark'
export type ResolvedTheme = 'light' | 'dark'

const THEME_STORAGE_KEY = 'mcnavTheme'

export function getStoredTheme(storage: Storage): ThemeMode | null {
  try {
    const value = storage.getItem(THEME_STORAGE_KEY)
    return isThemeMode(value) ? value : null
  } catch {
    return null
  }
}

export function saveTheme(storage: Storage, theme: ThemeMode): void {
  try {
    storage.setItem(THEME_STORAGE_KEY, theme)
  } catch {
    // Storage can be unavailable in private modes or restricted iframes.
  }
}

export function getSystemTheme(prefersDark: boolean): ResolvedTheme {
  return prefersDark ? 'dark' : 'light'
}

export function resolveTheme(theme: ThemeMode, prefersDark: boolean): ResolvedTheme {
  return theme === 'system' ? getSystemTheme(prefersDark) : theme
}

export function getNextTheme(theme: ThemeMode): ThemeMode {
  if (theme === 'system') {
    return 'light'
  }

  if (theme === 'light') {
    return 'dark'
  }

  return 'system'
}

export function applyTheme(
  themeMode: ThemeMode,
  resolvedTheme: ResolvedTheme,
  root: HTMLElement = document.documentElement
): void {
  root.dataset.themeMode = themeMode
  root.dataset.theme = resolvedTheme
}

function isThemeMode(value: string | null): value is ThemeMode {
  return value === 'system' || value === 'light' || value === 'dark'
}
