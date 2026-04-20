# 4. Data model

Six models. Django's `User` is reused as-is; the other five are ours.

## Models

### `User` (Django built-in)
Used as the form owner. No extension.

### `Form`
- `id` (UUID)
- `owner` → `User`
- `title`
- `status` — `draft` | `published`
- `published_title` — snapshot of `title` at last publish
- `published_questions` — JSON snapshot of all questions at last publish (what respondents actually see)
- `published_at` — when the form was last published
- `has_unpublished_changes` — bool; true when the creator has edited a published form but not re-published
- `created_at`, `updated_at`

Discarding changes on a published form restores `title` and the live questions from `published_title` / `published_questions`.

### `Question`
- `id` (UUID)
- `form` → `Form`
- `type` — one of 13 question types; per-type specs in [`docs/questions/`](../questions/). Current values: `short_text`, `long_text`, `multiple_choice`, `email`, `dropdown`, `number`, `phone_number`, `file_upload`, `date`, `time`, `linear_scale`, `rating`, `ranking`.
- `label`
- `required` — bool
- `position` — int (order within the form)
- `config` — JSON (type-specific settings; e.g. `{"choices": [...], "allow_multiple": false}` for multiple choice; `{"min": 1, "max": 5, "min_label": "...", "max_label": "..."}` for linear scale; `{"integer": true}` for number; `{}` for plain text types). See each type's doc for its exact shape.

### `Response`
- `id` (UUID)
- `form` → `Form`
- `status` — `draft` | `completed`
- `cookie_id` — opaque string written at creation (reserved for future cross-session resume)
- `questions_snapshot` — JSON snapshot of the form's questions at response start; answers render against this snapshot even if the creator edits the form afterwards
- `started_at`, `completed_at` (nullable until submitted)

### `Answer`
- `id` (UUID)
- `response` → `Response`
- `question` → `Question` (nullable; `SET_NULL` when the question is deleted so the answer survives)
- `value` — JSON (shape depends on the question's type; string for text / email / dropdown, array for ranking and multi-select multiple choice, number for numeric types, object for file upload). See each type's doc under [`docs/questions/`](../questions/) for the exact shape.
- `question_label`, `question_type`, `question_position`, `question_config` — snapshot of the question taken at write time so the answer remains readable even if the question is later edited or deleted

### `Upload`
Separate table so uploaded files don't bloat `Answer.value` and can be cleaned up independently.

- `id` (UUID)
- `response` → `Response` (nullable)
- `file` — stored file reference (served from `/media/`)
- `original_name`, `size`, `mime_type`
- `created_at`

A `post_delete` signal removes the underlying file from storage when an `Upload` row is deleted. `Answer.value` for a `file_upload` question references the upload by URL / filename / size.

## Relationships

```
User 1—N Form 1—N Question
              \
               1—N Response 1—N Answer N—1 Question
                    \
                     1—N Upload
```

## Notes

- **Required validation** is enforced at submit time and at "advance past this question" time on the respondent side.
- **JSON for `config` and `value`** keeps the schema flat and easy to extend when we add field types later.
- **Publish snapshots** (`published_title`, `published_questions`) and per-response snapshots (`questions_snapshot`, per-answer snapshot fields) together guarantee that responses stay readable even after the creator edits or deletes questions.

## Decisions

- **Field model:** single `Question` table with `type` enum and `config` JSON.
- **Answer model:** single `Answer` table with `value` JSON plus a snapshot of the question's label/type/position/config at write time, so historical responses stay readable across schema changes.
- **Response model:** single `Response` table with `status` field for draft vs. completed, plus a `questions_snapshot` captured at start.
- **Publish state:** published forms carry a title + questions snapshot on the `Form` row itself, so the live respondent view is stable while the creator edits.
- **File uploads:** separate `Upload` table with a post-delete signal to clean up stored files; `Answer.value` references the upload.
- **Question ordering:** integer `position` column, rewritten on reorder.
- **Owner relation:** `Form.owner` → Django `User`; deleting a user cascades to their forms (default Django behavior).
