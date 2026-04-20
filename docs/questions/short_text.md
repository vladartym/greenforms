# Short text

A single-line text input for brief answers such as names, titles, or short phrases.

## When to use

Pick short text when the expected answer fits on one line (typically a few words to one sentence). Examples: first name, company, job title, city. For multi-sentence answers reach for `long_text` instead.

## Data model

- Type key: `short_text`
- Value shape: `string`
- Config shape: `{}` (none)

## Respond UI

A single-line `<input>` styled to match the brand input. Enter advances to the next question. On mobile the default keyboard is shown. The input grows to fit the width of the question card.

## Builder UI

Standard question controls only: label, required toggle, and position handle. No type-specific settings.

## Validation

- Required: an empty or whitespace-only string fails with "This question is required." (enforced on submit, not per keystroke).
- Max length: 255 characters. Longer values return "Keep it under 255 characters."
- Null / empty values pass on individual save so the respondent can clear and re-type without an error.

## Notes

- The 255-cap is defined in `core/validation.py` as `SHORT_TEXT_MAX_LENGTH`.
- No regex or format options in MVP. Use `email` (or the future `phone_number`) when a specific format is required.
