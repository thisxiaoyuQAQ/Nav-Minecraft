export type Route =
  | { name: 'home' }
  | { name: 'post'; slug: string }
  | { name: 'not-found' }

export function parseRoute(pathname: string): Route {
  if (pathname === '/' || pathname === '') {
    return { name: 'home' }
  }

  const match = pathname.match(/^\/posts\/([^/]+)\/?$/)
  if (match) {
    return { name: 'post', slug: match[1] }
  }

  return { name: 'not-found' }
}
