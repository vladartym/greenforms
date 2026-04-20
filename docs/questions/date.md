# Date

A single calendar date.

## When to use

Birthdays, appointment dates, deadlines. For times of day use `time`; for a full timestamp, ask a date question and a time question.

## Data model

- Type key: `date`
- Value shape: `string` formatted as `"YYYY-MM-DD"` (ISO 8601)
- Config shape: `{}` (no per-question config)

## Respond UI

A native date picker (`<input type="date">`). The displayed format follows the user's locale; the stored value is always ISO.

## Builder UI

- Label, required toggle.
- No config: every date question accepts any date.

## Validation

- Required: null or empty fails with "This question is required."
- Format: must parse as ISO `YYYY-MM-DD`, otherwise "Enter a valid date."
- Null / empty passes on save.

## Notes

- Timezone-agnostic; this is a calendar date, not an instant.
