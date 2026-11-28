import { Toaster } from 'sonner'
import { useResolvedTheme } from '@/hooks/useResolvedTheme'
import { useMediaQuery } from '@/hooks/useMediaQuery'

/** Toasts styled from the same tokens as the rest of the app, so every theme applies. */
export default function AppToaster() {
  const theme = useResolvedTheme()
  const mobile = useMediaQuery('(max-width: 767px)')
  return (
    <Toaster
      theme={theme}
      position={mobile ? 'top-center' : 'bottom-right'}
      closeButton
      toastOptions={{
        style: {
          background: 'var(--surface)',
          color: 'var(--text)',
          border: '1px solid var(--line-strong)',
          borderRadius: 8,
          boxShadow: 'var(--pop-shadow)',
          fontFamily: 'inherit',
          fontSize: 13.5,
        },
      }}
    />
  )
}
