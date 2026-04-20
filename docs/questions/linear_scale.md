# Linear scale

A numeric button row for bounded opinion or rating questions, e.g. 1-5 or 0-10 NPS.

## When to use

Satisfaction ratings, likelihood scores (NPS: 0-10), agreement scales. For star-style ratings use `rating`; for free-form numbers use `number`.

## Data model

- Type key: `linear_scale`
- Value shape: `integer`
- Config shape: `{ min: number, max: number, min_label?: string, max_label?: string }`

## Respond UI

A horizontal row of buttons labelled `min` through `max`. Below the row, optional `min_label` and `max_label` anchors (e.g. "Not at all" / "Extremely").

## Builder UI

- Label, required toggle.
- Scale preset dropdown: `1 to 5`, `1 to 10`, or `0 to 10`. No custom range — pick a preset.
- Optional `Label for min` and `Label for max` text inputs. New questions are pre-filled with `Not likely` and `Very likely`.

## Validation

- Required: null fails with "This question is required."
- Value must be an integer in `[min, max]`. Out-of-range returns "Pick a value between {min} and {max}."
- Null / empty passes on save.

## Notes

- NPS: pick the `0 to 10` preset and set labels "Not likely" / "Very likely".
- No half-steps; floats are rejected.
