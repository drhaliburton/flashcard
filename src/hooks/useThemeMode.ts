import { useCallback, useState } from 'react'
import useMediaQuery from '@mui/material/useMediaQuery'
import type { PaletteMode } from '@mui/material'

const STORAGE_KEY = 'flashcards:theme-mode'

function loadOverride(): PaletteMode | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw === 'light' || raw === 'dark' ? raw : null
  } catch {
    return null
  }
}

export function useThemeMode() {
  const prefersDark = useMediaQuery('(prefers-color-scheme: dark)')
  const [override, setOverride] = useState<PaletteMode | null>(loadOverride)

  const mode: PaletteMode = override ?? (prefersDark ? 'dark' : 'light')

  const toggleMode = useCallback(() => {
    setOverride((prev) => {
      const current = prev ?? (prefersDark ? 'dark' : 'light')
      const next: PaletteMode = current === 'dark' ? 'light' : 'dark'
      try {
        localStorage.setItem(STORAGE_KEY, next)
      } catch {
        // localStorage unavailable — the override just won't persist across reloads
      }
      return next
    })
  }, [prefersDark])

  return { mode, toggleMode }
}
