---
name: parse-lesson-notes
description: Parse Spanish-lesson homework docs in /tareas into flashcards for the study app. Use when new homework has been added to /tareas, or when re-running the parse after editing this skill's rules.
---

# Parse Lesson Notes → Flashcards

Turns the messy `/tareas/*.md` homework exports into `src/data/flashcards.json`, the
data file the flashcard app reads. This is a judgment-driven parse, not a
regex/table script — the source docs are Google-Docs-to-Markdown exports with
wildly inconsistent formatting (bold markers vary, answers are sometimes in
parens, sometimes bolded, sometimes just missing, tables are sometimes
malformed), so read each doc and use your own judgment about what makes a
good flashcard rather than following mechanical rules.

## Step 1 — Preprocess each doc

The raw exports embed base64 image data as extremely long single lines, which
will blow past file-size limits and add nothing parseable (there's no
separate image-asset export, so a vocab row that pairs a word with only a
picture just becomes a text-only card). Before reading a doc, strip those
lines:

```bash
awk 'length($0) < 300' "tareas/<file>.md" > /tmp/<clean-name>.md
```

Then read the cleaned copy in full (use offset/limit to page through if it's
still long — do not skip sections).

## Step 2 — Source doc codes

Every card records which doc it came from, using these short codes:

| File | `sourceDoc` code |
|---|---|
| `Tareas Rebecca Haliburton (1).md` | `rebecca-1` |
| `Tareas Rebecca Haliburton 2.md` | `rebecca-2` |
| `Tareas Molly Thessin .docx.md` | `molly-1` |
| `Tareas Molly Thessin 2.docx.md` | `molly-2` |

Process **all** files present in `/tareas` regardless of the student name in
the filename — the content is what matters, not whose homework it was. If a
new file appears later, add it to this table with the next free short code
for that student before parsing it.

## Step 3 — What makes a good flashcard

Pull candidates from three kinds of source material:

1. **Vocabulary tables/lists** — a Spanish term (or short phrase) paired with
   its English meaning. Question = the Spanish term. Answer = the English
   meaning. Skip entries that are purely a picture reference with no legible
   text pair.
2. **Conjugation tables** — pronoun + infinitive → conjugated form. Question
   should read naturally, e.g. `"tú" + hablar (present)` or `Conjuga "hablar" con "tú" (presente)`.
   Answer = the conjugated form, e.g. `hablas`.
3. **Exercises with a recoverable answer** — fill-in-the-blank or
   translation exercises where the correct answer is unambiguously present
   in the source text (in parens, bolded, or as a completed sentence).
   Question = the exercise prompt/sentence with the blank or instruction
   intact (in Spanish, per the app's Spanish→English-vocab /
   Spanish→Spanish-grammar convention). Answer = the completed sentence or
   correct word.

**Skip**: exercises left blank in the source, prompts with no recoverable
answer, duplicate vocab entries already captured elsewhere in the same doc,
and pure logistics (payment info, class scheduling, "tareas para el lunes
X" headers).

Don't force every fragment into a card — a good flashcard is short enough to
read at a glance and has one clear, unambiguous answer. When a table row
contains multiple sub-items (e.g. a 3-column vocab table), split it into one
card per item, not one card per row.

## Step 4 — Category tags

Fixed category list (a card can have **one or more** — default to the single
most relevant tag, and only add a second when the card genuinely is doing
double duty, e.g. a new vocab word drilled specifically as a present-tense
conjugation target):

| Category | Covers |
|---|---|
| `vocabulary` | Standalone vocab terms/phrases and their meanings |
| `present-tense` | Present indicative: regular -ar/-er/-ir, irregular -oy verbs, -go verbs, tener, ir, estar, ser, gustar-family present forms |
| `preterite` | Pretérito (simple past, single completed action) |
| `imperfect` | Imperfecto (descriptive/habitual past) |
| `future-conditional` | Future tense and conditional (condicional), including polite requests/hypotheticals built on the conditional |
| `grammar-expressions` | Everything else structural: possessive adjectives, gustar/encantar/fascinar and pronoun objects, reflexive verbs, negation (nada/nadie/nunca/tampoco etc.), comparatives (más/menos/muy/mucho), prepositions |
| `exceptions` | A word/verb that breaks the regular pattern for whichever tense it's in — e.g. the present-tense `-oy` verbs (estar, dar, ser, ir) and `-go` verbs (hacer, poner, traer, salir...), tener (irregular only in `yo`), preterite stem-changers, imperfect's three irregulars (ir, ser, ver), conditional's irregular stems ("omiten la 'e'": poder→podr-, querer→querr-...; "cambian la 'd'": poner→pondr-, tener→tendr-...) |

**`exceptions` is always paired with the tense category it belongs to** —
it never appears alone on a card. An irregular present-tense verb gets
`["present-tense", "exceptions"]`, not just `["exceptions"]`. This is what
lets the app filter down to "just the irregular present-tense verbs" instead
of dumping all irregulars from every tense into one bucket.

`review` is **not** a category you assign — it's a runtime-only tag the app
manages in the browser (localStorage) when the user marks a card for review.
Never write `"review"` into `flashcards.json`.

## Step 5 — Stable IDs

Generate an id for each card as:

```
<sourceDoc>--<slug>
```

where `<slug>` is the question text: lowercased, accents stripped, anything
that isn't `[a-z0-9]` collapsed to a single `-`, truncated to ~50 chars, no
trailing `-`. Example: `rebecca-1--tu-estudias-espanol-y-yo-estudio`.

This is deliberately derived from **question text only**, not from category
— if you later re-tag a card's categories, or re-run this skill after minor
doc edits, the id must not change, because the app's review backlog
references cards by id in localStorage. If two distinct cards from the same
doc would slugify to the same id (rare), disambiguate by appending `-2`,
`-3`, etc. in source order.

## Step 6 — Write the output

Schema (matches `src/types.ts` in the app):

```ts
type Category =
  | 'vocabulary'
  | 'present-tense'
  | 'preterite'
  | 'imperfect'
  | 'future-conditional'
  | 'grammar-expressions'
  | 'exceptions'

interface Flashcard {
  id: string
  categories: Category[]
  question: string
  answer: string
  sourceDoc: string
}
```

`src/data/flashcards.json` is a JSON array of `Flashcard`. If the file
already exists:

- **Merge, don't overwrite.** Read the existing file first.
- For an id that already exists: update `question`/`answer`/`categories` if
  they've changed, otherwise leave it untouched.
- For a new id: append it.
- Don't delete an existing card unless you've re-read its source doc and the
  underlying line/row is genuinely gone (not just because this run happened
  to skip re-scanning that section).

If the file doesn't exist yet, create it as a fresh array.

## Step 7 — Report back

After writing the file, summarize for the user:

- Total card count, and count per category (a multi-tagged card counts
  toward each of its categories — state this explicitly).
- How many cards carry more than one category tag.
- 2–3 example cards per category so mis-parses or mis-categorization are
  easy to catch before they're relied on in the app.
