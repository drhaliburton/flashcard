import Box from '@mui/material/Box'
import Chip from '@mui/material/Chip'
import ToggleButton from '@mui/material/ToggleButton'
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup'
import Typography from '@mui/material/Typography'
import { CATEGORIES, CATEGORY_LABELS, type Category, type MatchMode } from '../types'

interface FilterBarProps {
  activeCategories: Set<Category>
  reviewFilterActive: boolean
  reviewCount: number
  matchMode: MatchMode
  onToggleCategory: (category: Category) => void
  onToggleReview: () => void
  onMatchModeChange: (mode: MatchMode) => void
}

export function FilterBar({
  activeCategories,
  reviewFilterActive,
  reviewCount,
  matchMode,
  onToggleCategory,
  onToggleReview,
  onMatchModeChange,
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
    </Box>
  )
}
