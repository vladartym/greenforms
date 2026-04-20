# Number

A numeric input, optionally restricted to whole numbers.

## When to use

Any numeric answer: age, quantity, score, price. Use `linear_scale` for bounded opinion scales, and `rating` for star-style ratings.

## Data model

- Type key: `number`
- Value shape: `number` (integer or float)
- Config shape: `{ integer?: boolean }`

## Respond UI

`<input type="number">`. On mobile this surfaces the number keypad. When `integer` is true, `step={1}`; otherwise `step="any"` for free-form decimals (e.g. `3.14159`). Enter advances.

## Builder UI

- Label, required toggle.
- "Whole numbers only" checkbox (default off).

## Validation

- Required: null fails with "This question is required."
- Value must parse as a number, otherwise "Enter a number."
- If `integer = true` and value has a fractional part: "Enter a whole number."
- Null / empty passes on save.

## Notes

- Stored as a JSON `number` (float). Downstream consumers coerce as needed.
- No min/max bounds and no currency formatting.
