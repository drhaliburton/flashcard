import { useMemo, useState } from 'react'
import Box from '@mui/material/Box'
import CssBaseline from '@mui/material/CssBaseline'
import Typography from '@mui/material/Typography'
import { ThemeProvider } from '@mui/material/styles'
import rawFlashcards from './data/flashcards.json'
import { FilterBar } from './components/FilterBar'
import { FlashcardView } from './components/FlashcardView'
import { EmptyState } from './components/EmptyState'
import { useDeck } from './hooks/useDeck'
import { useReviewBacklog } from './hooks/useReviewBacklog'
import { useThemeMode } from './hooks/useThemeMode'
import { getTheme } from './theme'
import { CATEGORIES, type Category, type Flashcard, type MatchMode } from './types'

const cards = rawFlashcards as unknown as Flashcard[]

function App() {
  const { mode, toggleMode } = useThemeMode()
  const theme = useMemo(() => getTheme(mode), [mode])

  const [activeCategories, setActiveCategories] = useState<Set<Category>>(new Set(CATEGORIES))
  const [reviewFilterActive, setReviewFilterActive] = useState(false)
  const [matchMode, setMatchMode] = useState<MatchMode>('any')
  const { backlog, markForReview, removeFromReview } = useReviewBacklog()

  const { currentCard, poolSize, advance } = useDeck({
    cards,
    activeCategories,
    reviewFilterActive,
    matchMode,
    backlog,
  })

  function toggleCategory(category: Category) {
    setActiveCategories((prev) => {
      const next = new Set(prev)
      if (next.has(category)) {
        next.delete(category)
      } else {
        next.add(category)
      }
      return next
    })
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box
        sx={{
          width: '100vw',
          height: '100dvh',
          display: 'flex',
          flexDirection: 'column',
          bgcolor: 'background.default',
          color: 'text.primary',
        }}
      >
        <FilterBar
          activeCategories={activeCategories}
          reviewFilterActive={reviewFilterActive}
          reviewCount={backlog.size}
          matchMode={matchMode}
          mode={mode}
          onToggleCategory={toggleCategory}
          onToggleReview={() => setReviewFilterActive((prev) => !prev)}
          onMatchModeChange={setMatchMode}
          onToggleMode={toggleMode}
        />

        {currentCard ? (
          <FlashcardView
            key={currentCard.id}
            card={currentCard}
            isInBacklog={backlog.has(currentCard.id)}
            onAdvance={advance}
            onMarkForReview={() => markForReview(currentCard.id)}
            onRemoveFromReview={() => removeFromReview(currentCard.id)}
          />
        ) : (
          <EmptyState />
        )}

        <Box sx={{ textAlign: 'center', py: 1 }}>
          <Typography variant="caption" color="text.secondary">
            {poolSize} card{poolSize === 1 ? '' : 's'} in this deck
          </Typography>
        </Box>
      </Box>
    </ThemeProvider>
  )
}

export default App
