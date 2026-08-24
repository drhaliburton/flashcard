export type Category =
  | 'vocabulary'
  | 'numbers'
  | 'present-tense'
  | 'preterite'
  | 'imperfect'
  | 'future-conditional'
  | 'grammar-expressions'
  | 'exceptions'

export const CATEGORIES: Category[] = [
  'vocabulary',
  'numbers',
  'present-tense',
  'preterite',
  'imperfect',
  'future-conditional',
  'grammar-expressions',
  'exceptions',
]

export const CATEGORY_LABELS: Record<Category, string> = {
  vocabulary: 'Vocabulary',
  numbers: 'Numbers',
  'present-tense': 'Present Tense',
  preterite: 'Preterite',
  imperfect: 'Imperfect',
  'future-conditional': 'Future / Conditional',
  'grammar-expressions': 'Grammar & Expressions',
  exceptions: 'Exceptions',
}

export type MatchMode = 'any' | 'all'

export interface Flashcard {
  id: string
  categories: Category[]
  question: string
  answer: string
  sourceDoc: string
}
