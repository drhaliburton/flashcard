import { useEffect, useState, type MouseEvent } from 'react'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Divider from '@mui/material/Divider'
import Typography from '@mui/material/Typography'
import type { Flashcard } from '../types'

interface FlashcardViewProps {
  card: Flashcard
  isInBacklog: boolean
  onAdvance: () => void
  onMarkForReview: () => void
  onRemoveFromReview: () => void
}

export function FlashcardView({
  card,
  isInBacklog,
  onAdvance,
  onMarkForReview,
  onRemoveFromReview,
}: FlashcardViewProps) {
  const [revealed, setRevealed] = useState(false)

  useEffect(() => {
    setRevealed(false)
  }, [card.id])

  function handleBodyClick() {
    if (!revealed) {
      setRevealed(true)
    } else {
      onAdvance()
    }
  }

  function handleReviewButtonClick(event: MouseEvent) {
    event.stopPropagation()
    if (isInBacklog) {
      onRemoveFromReview()
    } else {
      onMarkForReview()
    }
    onAdvance()
  }

  return (
    <Box
      onClick={handleBodyClick}
      sx={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        px: 4,
        py: 6,
        gap: 3,
        cursor: 'pointer',
        userSelect: 'none',
      }}
    >
      {!revealed ? (
        <Typography variant="h3" component="p">
          {card.question}
        </Typography>
      ) : (
        <>
          <Typography variant="h6" component="p" color="text.secondary">
            {card.question}
          </Typography>
          <Divider sx={{ width: '60%' }} />
          <Typography variant="h3" component="p">
            {card.answer}
          </Typography>
          <Button
            variant="outlined"
            color={isInBacklog ? 'secondary' : 'primary'}
            onClick={handleReviewButtonClick}
          >
            {isInBacklog ? 'Remove from review' : 'Mark for review'}
          </Button>
        </>
      )}
    </Box>
  )
}
