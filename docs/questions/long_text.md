# Long text

A multi-line textarea for open-ended answers.

## When to use

Pick long text for paragraph answers: feedback, descriptions, bug reports, qualitative survey responses. For one-liners use `short_text`.

## Data model

- Type key: `long_text`
- Value shape: `string`
- Config shape: `{}` (none)

## Respond UI

An auto-growing `<textarea>`. Enter inserts a newline; the explicit "Next" button (or Tab) advances. Scrolls internally once it hits a max visible height to keep the question card stable.

## Builder UI

Standard question controls only: label, required toggle, position handle. No type-specific settings.

## Validation

- Required: empty or whitespace-only fails on submit with "This question is required."
- Max length: 5000 characters. Longer values return "Keep it under 5000 characters."
- Null / empty passes on save so respondents can clear and re-type.

## Notes

- The 5000-cap lives in `core/validation.py` as `LONG_TEXT_MAX_LENGTH`.
- No rich text or markdown support in MVP; the stored value is plain text.
