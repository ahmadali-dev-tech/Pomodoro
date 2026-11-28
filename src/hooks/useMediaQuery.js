import { useEffect, useState } from 'react'

export function useMediaQuery(queryString) {
  const [matches, setMatches] = useState(() => window.matchMedia(queryString).matches)
  useEffect(() => {
    const media = window.matchMedia(queryString)
    const onChange = () => setMatches(media.matches)
    onChange()
    media.addEventListener?.('change', onChange)
    return () => media.removeEventListener?.('change', onChange)
  }, [queryString])
  return matches
}
