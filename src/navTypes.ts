export interface NavLink {
  type: 'link'
  title: string
  url: string
  description: string
  icon?: string
  tags: string[]
}

export interface NavGroup {
  type: 'group'
  name: string
  links: NavLink[]
}

export type NavEntry = NavLink | NavGroup

export interface NavCategory {
  id: string
  name: string
  icon: string
  description: string
  links: NavEntry[]
}
