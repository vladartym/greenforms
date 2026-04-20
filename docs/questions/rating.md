# Rating

A 5-star rating.

## When to use

Product reviews, experience ratings, anywhere a star icon is the expected visual. For more neutral numeric scales use `linear_scale`; for free numbers use `number`.

## Data model

- Type key: `rating`
- Value shape: `integer` (1 through 5, inclusive)
- Config shape: `{}` (no per-question config)

## Respond UI

A row of 5 star outlines. Hover fills the icons up to the hovered index; click to set, click again to clear.

## Builder UI

- Label, required toggle.
- No config: rating is always 1 to 5 stars.

## Validation

- Required: null fails with "This question is required."
- Value must be an integer in `[1, 5]`. Out-of-range returns "Pick a rating from 1 to 5."
- Null / empty passes on save.

## Notes

- No half-stars; integers only.
