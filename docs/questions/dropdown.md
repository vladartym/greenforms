# Dropdown

A single-select `<select>`-style picker for a long or dynamic list of options.

## When to use

Pick dropdown when the option count is large enough (10+) that a visible radio list feels heavy, or when vertical space matters. For 2-10 options `multiple_choice` reads better. For ordering, use `ranking`.

## Data model

- Type key: `dropdown`
- Value shape: `string`
- Config shape: `{ choices: string[] }`

## Respond UI

A closed trigger displaying the current selection, or the literal "Select an option" placeholder when unset. Clicking opens a scrollable menu of choices. Keyboard: type-to-filter (native `<select>` behaviour), arrow keys move focus, Enter selects and advances.

## Builder UI

- Label, required toggle.
- Choice editor (numbered list with add/remove). The question label itself acts as the prompt; there is no separate placeholder field.

## Validation

- Required: null or empty string fails with "This question is required."
- Value must be present in `config.choices`. Invalid returns "Pick one of the options."
- Null / empty passes on save.

## Notes

- Native `<select>` for accessibility and mobile parity.
- No multi-select dropdown; the unified `multiple_choice` with `allow_multiple` covers that use case.
