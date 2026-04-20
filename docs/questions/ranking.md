# Ranking

An ordered list where the respondent drags items into their preferred order.

## When to use

Prioritisation questions: "rank these features by importance", "order these by interest". For pick-one or pick-many without ordering, use `multiple_choice`.

## Data model

- Type key: `ranking`
- Value shape: `string[]` (ordered; index 0 = highest rank)
- Config shape: `{ choices: string[] }`

## Respond UI

A vertical list of choices with drag handles. Drag to reorder; with a handle focused, arrow keys reorder via keyboard. The rendered order reflects the current value; initial order mirrors `config.choices`.

## Builder UI

- Label, required toggle.
- Choice editor (same component as `multiple_choice`).

## Validation

- Required: null or empty array fails with "This question is required."
- Length: must equal `config.choices.length`. Otherwise "Rank all of the options."
- Contents: each choice must appear exactly once. Duplicates or unknown values return "Invalid ranking."
- Null / empty passes on save.

## Notes

- No "skip items" support in MVP; respondents rank all or none.
- If `config.choices` is edited after responses exist, stored rankings may reference removed choices. Mitigated by the per-answer `question_config` snapshot.
