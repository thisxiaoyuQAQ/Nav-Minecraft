export interface NavLink {
  title: string
  url: string
  description: string
  icon?: string
  tags: string[]
}

export interface NavCategory {
  id: string
  name: string
  icon: string
  description: string
  links: NavLink[]
}
