import { createTheme, type PaletteMode } from '@mui/material/styles'


const PRIMARY = '#004D40'
const SECONDARY = '#880E4F'

export function getTheme(mode: PaletteMode) {
  return createTheme({
    palette: {
      mode,
      primary: { main: PRIMARY },
      secondary: { main: SECONDARY },
    },
  })
}
