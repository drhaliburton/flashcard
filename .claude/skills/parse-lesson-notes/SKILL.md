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

## Step 3a — Failure patterns to avoid (found and fixed by hand — don't reintroduce them)

A first pass at this deck produced ~2500 cards, and a careful review turned up
several recurring defects — over 250 cards needed fixing. Every one of them
boiled down to the same root cause: **the question didn't uniquely determine
one answer** — either because the answer (or enough of it) was already
sitting in the question, or because the question didn't signal that a
transformation/blank was expected at all. Check every candidate card against
these before adding it:

1. **The question already contains the fully-conjugated answer, just
   reordered.** A "describe when this happened" drill gave a complete
   sentence plus a time-phrase hint, and the "answer" was just the same
   sentence with the time phrase moved to the front:
   - Bad: Q `Comí comida de India. (el año pasado)` A `El año pasado comí comida de India.`
   - Fixed: Q `El año pasado (comer) comida de India.` A `El año pasado comí comida de India.`
   - **Test**: strip the question's `(...)` hint and check if what's left is
     already a substring of the answer, word-for-word. If so, the verb needs
     to become an infinitive-in-parens blank instead, with the hint content
     (time phrase, etc.) moved to sit naturally in the sentence.

2. **A compound sentence's first clause gives away the second clause's
   conjugation**, when both subjects are the same grammatical person/number:
   - Bad: Q `Juan hizo la tarea y Marta ___ (hacer) la tarea.` (both 3rd-person singular, so "hizo" is just copied)
   - Fixed: Q `Marta ___ (hacer) la tarea.` A `Marta hizo la tarea.`
   - Only a problem when the two subjects share person/number — if they
     differ (e.g. `tú`/`ustedes`), the conjugation genuinely differs and the
     first clause isn't a giveaway; leave those alone.

3. **A "you have to do X" task card restates the whole task** instead of
   testing the conjugation the exercise was actually about:
   - Bad: Q `Carlitos, tú tienes que ___ (lavar los platos).` A `Carlitos, tú tienes que lavar los platos.`
   - Fixed: Q `Carlitos, tú (tener) que lavar los platos.` A (unchanged) — now it tests the irregular `tener` conjugation, tag `["present-tense", "exceptions"]`.

4. **A hint duplicates an adjacent blank instead of aiding it** (e.g. a
   preposition-contraction hint placed right next to its own blank):
   - Bad: Q `Ustedes van (a la) ___ estación de buses.`
   - Fixed: Q `Ustedes van ___ estación de buses.`

5. **A Spanish word is given directly as the hint when an English gloss
   would do the same job without handing over the answer** — this shows up
   most with demonstratives, invariant intensifiers, and possessive
   adjectives:
   - Bad: Q `Usamos (estos) papeles en la oficina.` (the Spanish demonstrative *is* the answer)
   - Fixed: Q `Usamos (these) papeles en la oficina.`
   - Bad: Q `Necesitamos (más) información.` (más/menos/muy never change form — the hint always equals the answer)
   - Fixed: Q `Necesitamos ___ (more) información.`
   - Bad: Q `Ustedes leen (muchos) libros.` (the hint happened to already be gender/number-agreed, so nothing was left to figure out)
   - Fixed: Q `Ustedes leen ___ (many) libros.`
   - The general rule: **if the parenthetical content, inserted as-is, produces
     the literal correct answer with zero change, it's not a hint — it's the
     answer.** Either the underlying test still requires a real
     transformation (keep a hint that differs from the final form, e.g. base
     `mucho` when the answer needs `mucha`/`muchos`/`muchas` for gender/number
     agreement — that's a legitimate hint, leave it), or it doesn't (replace
     with a blank + a same-meaning English gloss).

6. **A blank with no hint at all is just a guessing game** — many different
   words could grammatically complete the sentence, so the learner can't
   know which one is being tested:
   - Bad: Q `Tú trabajas ___.` (mucho? poco? bien? mal? — no way to know)
   - Fixed: Q `Tú trabajas ___ (a lot).`
   - Exception: a blank is fine with **no** hint when the surrounding
     grammar already forces a unique answer — e.g. `A ti ___ gustan las
     playas de Miami.` can only take `te` (the `a ti` phrase deterministically
     requires it), so no hint is needed there.

7. **Several sub-items get crammed into one card** instead of one card per
   testable item:
   - Bad: Q `(mucha) tarea, (mucho) café, (muchas) ciudades` A `mucha tarea, mucho café, muchas ciudades`
   - Fixed: three separate cards, each `Completa: ___ (much/many) <noun>.`

8. **A transformation exercise gives no indication a transformation is
   needed at all** — the question reads as a perfectly normal, complete
   sentence (or question) in one form, and the answer is a *different*
   sentence in another form, with nothing telling the learner what to do:
   - Bad (affirmative → negative): Q `Ustedes miraron la película también.` A `Ustedes tampoco miraron la película.`
   - Fixed: Q `Cambia a la negación: Ustedes miraron la película también.` A (unchanged)
   - Bad (present → imperfect): Q `Juanito viene aquí todos los días.` A `Juanito venía aquí todos los días.`
   - Fixed: Q `Cambia al imperfecto: Juanito viene aquí todos los días.` A (unchanged)
   - The same applies when the question is itself a `¿...?` that implies a
     transformation, not a direct answer — e.g. `¿Alguien tocó la puerta?` →
     `Nadie tocó la puerta.` needed `Responde en negación:` prepended, since a
     literal reading would make "Sí, alguien tocó" seem equally valid.
   - This does **not** apply to a `¿...?` question whose answer is uniquely
     determined already — a translation (`¿Qué tal?` → "What's up?"), factual
     recall tied to a specific passage the doc provides, or a grammar-form
     recall question. Only add a transformation instruction when the
     question's surface form doesn't already make the expected answer type
     obvious.

9. **The question is a raw fragment/word-list from the source table**, not a
   real sentence — e.g. copied straight from a "words to combine" exercise:
   - Bad: Q `Carlos / siempre / comer / aquel / restaurante.` A `Carlos siempre comía en aquel restaurante.`
   - Fixed: Q `Cambia al imperfecto: Carlos siempre come en aquel restaurante.` A (unchanged) — reconstruct the natural sentence the fragments imply (matching tense/structure of the given answer) rather than leaving slash-separated pieces.

10. **An open question has many equally-valid answers**, so there's no way
    to know which specific one is being tested (as opposed to a question with
    one deterministically correct answer):
    - Bad: Q `¿Con qué frecuencia compras el periódico?` A `Compro el periódico a veces.` (siempre/todos los días/nunca would all be grammatically fine answers too)
    - Fixed: Q `Compro el periódico ___ (sometimes).` A `Compro el periódico a veces.`

11. **A personal free-response prompt with no fixed answer** — skip these
    entirely (already covered above), including truncated ones where the
    "question" is just a bare time phrase with no verb or blank at all (e.g.
    `El próximo fin de semana` paired with a full personal-essay-style
    answer sentence). If you can't point to one specific correct fill, don't
    make it a card.

12. **A conjugation blank doesn't say which tense to use.** `(infinitivo)`
    alone is ambiguous — a bare infinitive could be conjugated into present,
    preterite, imperfect, future, or conditional, and the category tag isn't
    visible on the card itself:
    - Bad: Q `Yo no (estar) allí.` A `Yo no estuve allí.`
    - Fixed: Q `Yo no (estar, pretérito) allí.` A (unchanged)
    - Always append the tense name after a comma inside the same parens:
      `presente`, `pretérito`, `imperfecto`, `futuro`, `condicional` — pick
      whichever one the card's own category tag says it's testing. Skip this
      only when the sentence already makes the tense unambiguous some other
      way (e.g. a parallel clause in the same tense: `Yo estudio español y tú
      ___ (estudiar) español.` doesn't need a label — "estudio" already fixes
      it as present).

13. **A question sounds answerable but the answer is really the student's
    own invented/personal content** — a specific TV show they watched, why
    *their* friend was mad, how many siblings *they* have, what's in *their*
    suitcase. There's no way to derive that specific answer from the
    question, general Spanish knowledge, or anything else in the doc:
    - Bad: Q `¿Por qué estará enojado tu amigo?` A `Mi amigo estará enojado porque él perdió su trabajo.` (an invented reason — any reason would be equally "correct")
    - Bad: Q `¿Cuántos hermanos tienes?` A `Solo tengo un hermano.` (the student's own family, not something a reviewer could ever know)
    - These get **skipped entirely**, same as the personal free-response
      prompts already covered in Step 3 — don't try to reformat them, there's
      no fixed answer to reformat toward.
    - Don't over-apply this: a question that *sounds* personal but is really
      drilling one specific memorized idiom/expression from a closed list the
      doc is teaching is fine to keep — e.g. `¿Te gustaría salir esta noche?`
      → `Mejor no.` is testing recall of a specific negative-expression idiom
      from a vocab list, not asking about the student's actual plans. And a
      question tied to a specific passage/story the doc provides (a reading
      passage, a fictional dialogue) is comprehension recall, not personal
      invention — keep those too, e.g. `¿Por qué se enojó el gorila?` →
      `Porque su amiga le tomó una foto.` (answerable from the zoo story in
      the doc). The test: could two different students who did this same
      homework have written equally valid but different answers? If yes,
      it's personal — skip it.

**Before finalizing a batch, spot-check against rules 1, 5, 6, 12, and 13 in
particular** — they're the most common and the easiest to introduce by
habit (copying a source sentence into the question because it "looks like" a
useful sentence, without checking whether it already reveals the very thing
being tested, or looks answerable without checking whether the answer is
actually derivable from anything in the doc).

## Step 4 — Category tags

Fixed category list (a card can have **one or more** — default to the single
most relevant tag, and only add a second when the card genuinely is doing
double duty, e.g. a new vocab word drilled specifically as a present-tense
conjugation target):

| Category | Covers |
|---|---|
| `vocabulary` | Standalone vocab terms/phrases and their meanings |
| `numbers` | Cardinal numbers (0–100 are already seeded directly, not parsed from a doc) — tag a doc-derived number word here instead of `vocabulary` when it's specifically drilling a number |
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
  | 'numbers'
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
