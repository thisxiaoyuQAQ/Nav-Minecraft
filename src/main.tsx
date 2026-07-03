import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './App'
import { categories } from './navData'
import { posts } from './postData'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App initialCategories={categories} initialPosts={posts} />
  </StrictMode>
)
