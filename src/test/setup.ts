import '@testing-library/jest-dom/vitest'

// jsdom doesn't implement scrollTo; silence the "Not implemented" noise from navigate().
// Guarded for non-jsdom environments (some test files use @vitest-environment node).
if (typeof window !== 'undefined') {
  window.scrollTo = () => {}
}
