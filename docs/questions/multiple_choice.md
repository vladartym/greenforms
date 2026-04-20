# Multiple choice

A list of predefined options the respondent selects from. Supports single-select (radio) and multi-select (checkbox) via a config toggle.

## When to use

Any question with a fixed, short list of options (typically 2-10). When the list is long or dynamic, prefer `dropdown`. When users need to order options, use `ranking`.

## Data model

- Type key: `multiple_choice`
- Value shape:
  - `string` when `allow_multiple = false` (default)
  - `string[]` when `allow_multiple = true`
- Config shape: `{ choices: string[], allow_multiple: boolean }`

## Respond UI

- `allow_multiple = false`: vertical list of radio-style rows. Click or arrow keys to select one. Enter advances.
- `allow_multiple = true`: vertical list of checkbox-style rows. Click toggles each row. Enter advances.

Both variants use the same row component; only the selection icon and click behaviour differ.

## Builder UI

- Label, required toggle.
- `allow_multiple` toggle (default off).
- Choice editor: add, reorder, or remove rows. Empty rows are stripped on save.

## Validation

- Required (single): null or empty string fails with "This question is required."
- Required (multi): null or empty array fails with the same message.
- Each value must be present in `config.choices`. Invalid value returns "Pick one of the options." (single) or "Pick from the listed options." (multi).
- Null / empty passes on save.

## Notes

- Current implementation in `core/validation.py` handles only the single-select path. `allow_multiple` is the planned extension when this type is re-implemented.
- Choices are stored as plain strings with no stable IDs, so renaming a choice after responses exist breaks historical answers. Mitigated by the per-answer snapshot in `Answer.question_config`.
