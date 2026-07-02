export function getFaviconUrl(url: string): string | undefined {
  try {
    const parsedUrl = new URL(url)

    if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
      return undefined
    }

    return `https://www.google.com/s2/favicons?domain=${parsedUrl.hostname}&sz=64`
  } catch {
    return undefined
  }
}

export function getFallbackIconLabel(title: string, categoryIcon = 'M'): string {
  const [firstCharacter] = title.trim()
  return (firstCharacter ?? categoryIcon).toLocaleUpperCase()
}
