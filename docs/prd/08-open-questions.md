# 8. Open questions

Decisions we know we haven't made yet. Some are stretch features whose shape gets designed when we build them. Others are small details we'll resolve in code.

## Open

- **Form deletion: cascade or soft delete.** Default plan is Django cascade — deleting a form deletes its responses. Worth revisiting if response history should outlive the form.
- **Draft response expiry.** Drafts will accumulate over time. No cleanup planned for MVP.
- **Multiple-choice in CSV export.** Stretch feature. How to represent a selected option in a CSV cell — option label, index, or id?
- **Cross-session resume shape.** `Response.cookie_id` is already written on create; the respondent UX (cookie write, lookup on return, partial-answer restore) is still unspecified.

## Decisions

- These items are deliberately deferred — each will be decided when we hit it in code or revisit it in design.
- **Question deletion when answers exist.** Resolved: `Answer.question` is `SET_NULL` and `Answer` carries a snapshot (label/type/position/config) written at answer-save time. Deleting a question preserves submitted responses; the responses view shows the orphan answers in a `(removed)` column. Form-edit autosave reconciles questions in place rather than wiping and recreating, so editing or reordering never destroys existing answers.
- **Public URL format.** Resolved: public forms are reached at `/f/:formId` using the form's UUID; no separate share code.
- **Form duplication semantics.** Resolved: `POST /api/forms/{id}/duplicate` creates a new `draft` form with `" (copy)"` appended to the title, cloned questions, and no published snapshot.
- **Multiple-choice options UI.** Resolved: the builder supports add / remove of options inline on the question card.
- **Branching data model.** Resolved: nullable `logic` JSON on `Question` with a single jump rule (`operator`, `value`, `target_question_id`); snapshotted alongside `config` at publish and response start. Full shape in [§9](./09-conditional-logic.md).
