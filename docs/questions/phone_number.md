# Phone number

A single-line input for US-style phone numbers, guided by an input mask.

## When to use

Collect a callable number for sales follow-up, SMS, or 2FA. For general text asks use `short_text`.

## Data model

- Type key: `phone_number`
- Value shape: `string` formatted as `"(NNN) NNN-NNNN"` (mask preserved)
- Config shape: `{}` (no per-question config)

## Respond UI

A text input with a fixed `(000) 000-0000` mask, placeholder `(___) ___-____`, and `inputMode="tel"` so mobile shows the phone keypad. Enter advances only when the mask is fully filled.

## Builder UI

- Label, required toggle.
- No config: every phone number uses the US 10-digit format.

## Validation

- Required: empty fails with "This question is required."
- Format: backend checks the saved string against `^\(\d{3}\) \d{3}-\d{4}$`. Incomplete or malformed values return "Enter a valid phone number."
- Null / empty passes on save.

## Notes

- US-only format. International numbers are out of scope.
- No SMS or voice verification; this is plain format validation.
