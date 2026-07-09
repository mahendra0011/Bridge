import { useState, useEffect } from 'react'

const KEY = 'bridge_theme'

export function useDarkMode() {
  const [dark, setDark] = useState(() => {
    // 1. localStorage preference wins
    const saved = localStorage.getItem(KEY)
    if (saved) return saved === 'dark'
    // 2. OS preference fallback
    return window.matchMedia('(prefers-color-scheme: dark)').matches
  })

  useEffect(() => {
    const root = document.documentElement
    if (dark) {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }
    localStorage.setItem(KEY, dark ? 'dark' : 'light')
  }, [dark])

  const toggle = () => setDark(d => !d)

  return { dark, toggle }
}
