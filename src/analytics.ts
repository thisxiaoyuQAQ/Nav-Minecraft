// Google Analytics 4 (gtag.js) 的轻量封装。
// gtag.js 脚本本身在 index.html 里加载并完成 gtag('config', ...) 初始化;
// 这里只负责在 SPA 路由切换时手动上报 page_view。

declare global {
  interface Window {
    dataLayer?: unknown[]
    gtag?: (...args: unknown[]) => void
  }
}

/**
 * 上报一次页面浏览。在首次挂载、站内 navigate() 以及 popstate 时调用。
 * 若 gtag 尚未加载完成(或被广告拦截器拦截),则静默跳过,不影响渲染。
 */
export function trackPageView(path: string): void {
  if (typeof window === 'undefined' || typeof window.gtag !== 'function') {
    return
  }

  window.gtag('event', 'page_view', {
    page_path: path,
    page_title: document.title
  })
}
