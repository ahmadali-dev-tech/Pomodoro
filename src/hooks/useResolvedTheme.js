import { useEffect, useState } from 'react'
import { useUIStore } from '@/stores/uiStore'

const query = () => window.matchMedia('(prefers-color-scheme: dark)')

/** "dark" or "light": the theme in effect, resolving the "system" option. */
export function useResolvedTheme() {
  const theme = useUIStore(s => s.theme)
  const [systemDark, setSystemDark] = useState(() => query().matches)

  useEffect(() => {
    const media = query()
    const onChange = () => setSystemDark(media.matches)
    media.addEventListener?.('change', onChange)
    return () => media.removeEventListener?.('change', onChange)
  }, [])

  return theme === 'system' ? (systemDark ? 'dark' : 'light') : theme
}
