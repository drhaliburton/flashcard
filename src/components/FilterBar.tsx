import Box from '@mui/material/Box'
import Chip from '@mui/material/Chip'
import IconButton from '@mui/material/IconButton'
import ToggleButton from '@mui/material/ToggleButton'
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup'
import Tooltip from '@mui/material/Tooltip'
import Typography from '@mui/material/Typography'
import DarkModeIcon from '@mui/icons-material/DarkMode'
import LightModeIcon from '@mui/icons-material/LightMode'
import type { PaletteMode } from '@mui/material'
import { CATEGORIES, CATEGORY_LABELS, type Category, type MatchMode } from '../types'

interface FilterBarProps {
  activeCategories: Set<Category>
  reviewFilterActive: boolean
  reviewCount: number
  matchMode: MatchMode
  mode: PaletteMode
  onToggleCategory: (category: Category) => void
  onToggleReview: () => void
  onMatchModeChange: (mode: MatchMode) => void
  onToggleMode: () => void
}

export function FilterBar({
  activeCategories,
  reviewFilterActive,
  reviewCount,
  matchMode,
  mode,
  onToggleCategory,
  onToggleReview,
  onMatchModeChange,
  onToggleMode,
}: FilterBarProps) {
  return (
    <Box
      sx={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        gap: 1,
        px: 2,
        py: 1.5,
        borderBottom: 1,
        borderColor: 'divider',
      }}
    >
      {CATEGORIES.map((category) => (
        <Chip
          key={category}
          label={CATEGORY_LABELS[category]}
          color={activeCategories.has(category) ? 'primary' : 'default'}
          variant={activeCategories.has(category) ? 'filled' : 'outlined'}
          onClick={() => onToggleCategory(category)}
        />
      ))}
      <Chip
        label={`Review${reviewCount > 0 ? ` (${reviewCount})` : ''}`}
        color={reviewFilterActive ? 'secondary' : 'default'}
        variant={reviewFilterActive ? 'filled' : 'outlined'}
        onClick={onToggleReview}
      />

      <Box sx={{ flexGrow: 1 }} />

      <Typography variant="body2" color="text.secondary">
        Match:
      </Typography>
      <ToggleButtonGroup
        size="small"
        exclusive
        value={matchMode}
        onChange={(_event, value: MatchMode | null) => {
          if (value) onMatchModeChange(value)
        }}
      >
        <ToggleButton value="any">Any</ToggleButton>
        <ToggleButton value="all">All</ToggleButton>
      </ToggleButtonGroup>

      <Tooltip title={mode === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}>
        <IconButton onClick={onToggleMode} size="small" color="inherit">
          {mode === 'dark' ? <LightModeIcon fontSize="small" /> : <DarkModeIcon fontSize="small" />}
        </IconButton>
      </Tooltip>
    </Box>
  )
}
