import { useEffect, useMemo, useRef, useState } from 'react'
import type { Category, Flashcard, MatchMode } from '../types'
import { shuffle } from '../utils/shuffle'

interface UseDeckArgs {
  cards: Flashcard[]
  activeCategories: Set<Category>
  reviewFilterActive: boolean
  matchMode: MatchMode
  backlog: Set<string>
}

function cardMatches(
  card: Flashcard,
  activeCategories: Set<Category>,
  reviewFilterActive: boolean,
  matchMode: MatchMode,
  backlog: Set<string>,
): boolean {
  const effectiveTags = new Set<string>(card.categories)
  if (backlog.has(card.id)) effectiveTags.add('review')

  const checked: string[] = [...activeCategories]
  if (reviewFilterActive) checked.push('review')
  if (checked.length === 0) return false

  return matchMode === 'any'
    ? checked.some((tag) => effectiveTags.has(tag))
    : checked.every((tag) => effectiveTags.has(tag))
}

export function useDeck({ cards, activeCategories, reviewFilterActive, matchMode, backlog }: UseDeckArgs) {
  const filtersKey = `${[...activeCategories].sort().join(',')}|${reviewFilterActive}|${matchMode}`
  const backlogKey = [...backlog].sort().join(',')

  const pool = useMemo(
    () => cards.filter((c) => cardMatches(c, activeCategories, reviewFilterActive, matchMode, backlog)),
    // filtersKey/backlogKey are stable string summaries of the Set-valued deps below
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [cards, filtersKey, backlogKey],
  )

  const cardsById = useMemo(() => new Map(cards.map((c) => [c.id, c])), [cards])

  const [orderIds, setOrderIds] = useState<string[]>([])
  const [position, setPosition] = useState(0)
  const prevPoolKey = useRef<string>('')

  useEffect(() => {
    const poolKey = pool.map((c) => c.id).sort().join(',')
    if (poolKey !== prevPoolKey.current) {
      prevPoolKey.current = poolKey
      setOrderIds(shuffle(pool.map((c) => c.id)))
      setPosition(0)
    }
  }, [pool])

  const currentCard: Flashcard | null =
    orderIds.length > 0 ? cardsById.get(orderIds[position]) ?? null : null

  function advance() {
    if (orderIds.length === 0) return
    if (position + 1 >= orderIds.length) {
      setOrderIds((prev) => shuffle(prev))
      setPosition(0)
    } else {
      setPosition((p) => p + 1)
    }
  }

  return { currentCard, poolSize: pool.length, advance }
}
