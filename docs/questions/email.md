# Email

A single-line input constrained to valid email addresses.

## When to use

Whenever a contact email is needed: lead capture, account creation, follow-up. For multiple contact methods ask each separately.

## Data model

- Type key: `email`
- Value shape: `string`
- Config shape: `{}` (none)

## Respond UI

`<input type="email">`, which hints the mobile email keyboard and enables browser-level format hints. Enter advances. No autocomplete beyond the browser's default.

## Builder UI

Standard question controls only: label, required toggle, position handle. No type-specific settings.

## Validation

- Required: empty fails on submit with "This question is required."
- Format: validated via Django's `EmailValidator` on save. Invalid addresses return "Enter a valid email."
- Null / empty passes on save.

## Notes

- No domain allow / deny lists in MVP.
- The same backend validator runs on submit, so respondents cannot bypass the check by disabling client JS.
