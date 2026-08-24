import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'

export function EmptyState() {
  return (
    <Box
      sx={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        px: 4,
      }}
    >
      <Typography variant="h6" color="text.secondary">
        No cards match the selected filters. Try turning on another category, or switching Match to "Any".
      </Typography>
    </Box>
  )
}
