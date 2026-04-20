# Time

A single time of day, entered with a 12-hour AM/PM mask and stored in 24-hour format.

## When to use

Appointment times, availability windows, event start times. Pair with `date` for full timestamps.

## Data model

- Type key: `time`
- Value shape: `string` formatted as `"HH:MM"` (24-hour, e.g. `"14:30"`)
- Config shape: `{}` (no per-question config)

## Respond UI

A masked text input shaped `__:__ __` accepting 1-12 for hour, 0-59 for minutes, and `AM`/`PM`. The respondent sees 12-hour AM/PM (e.g. `02:30 PM`); the value is converted to 24-hour `HH:MM` before save.

## Builder UI

- Label, required toggle.
- No config: time is always a single 12-hour AM/PM input.

## Validation

- Required: null or empty fails with "This question is required."
- Format: must match `HH:MM` where `00 <= HH <= 23` and `00 <= MM <= 59`. Invalid returns "Enter a valid time."
- Null / empty passes on save.

## Notes

- Seconds not supported.
- Timezone-agnostic; this is a wall-clock time.
