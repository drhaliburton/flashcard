import { createTheme, type PaletteMode } from '@mui/material/styles'

// Primary: deep forest green (given). Secondary: true color-wheel
// complement (~159° -> ~339°), pulled back from a raw complementary red-pink
// to a dustier rose/berry (moderate saturation/lightness) so it reads as an
// elegant accent next to the green rather than clashing with it.
const PRIMARY = '#095239'
const SECONDARY = '#B23A63'

export function getTheme(mode: PaletteMode) {
  return createTheme({
    palette: {
      mode,
      primary: { main: PRIMARY },
      secondary: { main: SECONDARY },
    },
  })
}
