# 9. Conditional logic

Minimal jump-to-question logic so creators can personalize a form's path based on an earlier answer. "If answer to Q3 is X, jump to Q5; otherwise continue."

## Purpose

Generic form builders feel rigid without branching. Even a minimal version unlocks personalization (skip irrelevant sections, route power users past onboarding) and keeps GreenForms competitive with the core Typeform behaviour. This PRD locks the smallest viable shape: one rule per question, source-based jumps, two operators, two supported field types.

## MVP scope

- **Action.** One action only: jump to another question. No show/hide, no early-end, no "go to thank-you."
- **Direction.** Source-based. The rule lives on the question being answered: "after this question, if answer matches, go to question X."
- **One rule per question.** Each question has at most one jump rule. If it matches, jump. If it doesn't, advance by `position` as today.
- **Single condition.** One left-hand side (the current question's answer), one operator, one right-hand value. No AND/OR.
- **Operators.** `equals`, `not_equals`.
- **Trigger types (MVP).** `short_text` and `multiple_choice` only. The remaining 11 field types get logic in a later iteration.
- **Forward-only targets.** Target question's `position` must be greater than the source's. Prevents loops and keeps traversal linear.
- **Required bypass.** A question that was skipped by a jump does not block submit even if `required` is true. Required only applies when the question is actually on the respondent's path.
- **Stale answer cleanup.** If the respondent navigates back and changes an answer so a previously-answered question is no longer on their path, that answer is dropped on submit. Only answers for questions on the final traversed path persist.
- **Progress bar.** Stays static: answered count over total question count. The bar may not reach 100% when questions are skipped. Accepted trade-off for simplicity.

## Hidden questions

Opt-in, per-question visibility flag that composes with jump rules.

- New `hidden: boolean` field on `Question`, default `false`.
- A hidden question is **skipped by the respondent's position-based traversal** (the default "advance to next" behaviour).
- A hidden question is **still a legal jump target**. If an earlier question's `logic.target_question_id` points at a hidden question, the respondent is taken there. Explicit jumps override the hidden-skip default.
- A hidden question can itself carry `logic`. When the respondent reaches it via a jump and answers it, its logic evaluates normally: matched target wins, otherwise fall through to the next non-hidden question by position.
- Starting question: first question by `position` with `hidden === false`. If every question is hidden, the form completes immediately with an empty path (pathological but not a crash).
- `required` interaction: identical to the "skipped by jump" case. A hidden question that's never on the respondent's path has its `required` bypassed. If a hidden question IS jumped to and required, the respondent must answer it.
- Publish validation: no new checks. A form with all-hidden questions, or with a dead hidden question (no jump targets it), is allowed. Those are user choices, not publish blockers.
- Creator UI: a "Hidden" checkbox on each question card, placed directly after "Required". Same accessibility and styling as Required.
- Snapshot: `hidden` is frozen into `Form.published_questions` at publish and `Response.questions_snapshot` at response start, same as `logic`. `Answer` gains `question_hidden` alongside the other snapshot fields.

## Non-goals (this iteration)

- "Show if" rules with arbitrary conditions. If you want a question to appear only on certain answers, use `hidden: true` plus a jump rule that targets it.
- Jump to thank-you / end form early.
- Multiple rules per question (e.g. a branching multiple-choice with a different target per option).
- Compound conditions (AND, OR, grouping).
- Operators beyond equals / not_equals (`contains`, `is_empty`, `greater_than`, etc.).
- Backward jumps and loops.
- Logic on field types other than short_text and multiple_choice.
- A dedicated full-form rule editor (logic is edited inline on each question card).

## Data model delta

New nullable JSON field on `Question`:

```
logic: JSON | null
```

Shape when present:

```json
{
  "operator": "equals" | "not_equals",
  "value": "<string for short_text | choice value for multiple_choice>",
  "target_question_id": "<uuid of a later question in the same form>"
}
```

Snapshot behaviour matches `config`:

- `Form.published_questions` includes each question's `logic` at publish time.
- `Response.questions_snapshot` captures `logic` at response start; in-flight respondents keep the logic they began with even if the creator re-publishes.
- `Answer` gains a new snapshot field `question_logic` (alongside the existing `question_label`, `question_type`, `question_position`, `question_config`), written at answer save time.

No new tables. The single JSON field on `Question` is enough for MVP and leaves room to evolve into a rules array later without a migration.

## Respondent traversal

The client owns path evaluation; the server validates and cleans up stale answers on submit.

1. Start at the first question by `position` from `questions_snapshot`.
2. When the respondent advances:
   a. Save the answer (existing `PUT /api/responses/{id}/answers/{question_id}`).
   b. Read the current question's `logic`. If present and the answer matches the condition, the next question is the one whose `id` equals `target_question_id`.
   c. Otherwise, the next question is the next by `position`.
3. Maintain a client-side path stack of visited question ids.
4. Back button pops the stack and returns to the previous question.
5. Changing an earlier answer and advancing again re-evaluates from that point forward. Questions that are no longer on the path are removed from the stack.
6. Submit (`POST /api/responses/{id}/submit`) includes the final path. The server deletes any `Answer` rows for this response whose `question_id` is not in the submitted path, then marks the response completed. Required-question validation runs only against questions on the submitted path.

Open implementation note: an alternative is to have the server re-derive the path from submitted answers plus snapshot logic, avoiding client trust. Decide during implementation; both satisfy the contract above.

## Creator UI

- A new **Logic** section appears as a collapsible accordion inside each question card in the form builder, below the existing type-specific config.
- **Supported types (short_text, multiple_choice):** the section contains three controls:
  - Operator select: `equals` / `is not`.
  - Value input: plain text for `short_text`; a dropdown of the question's own choices for `multiple_choice`.
  - Target question dropdown: lists every question whose `position` is greater than this one, showing its label and type icon.
- **Unsupported types:** the section header is visible but the body shows a short note, "Logic isn't supported on this field type yet," with no controls. Keeps the UI consistent across cards and signals the roadmap.
- **Empty state:** when no logic is set, the collapsed header reads "No logic. Respondents continue to the next question."
- **Publish validation.** When `logic` is set on a question, publish rejects the form if any of the following hold: operator missing, value missing, target missing, target question not found in the form, target's `position` is not greater than the source's. Error messages surface on the offending card.

## API changes

All changes ride on the existing form and response endpoints. No new routes.

- `QuestionIn` / `QuestionOut` schemas (`core/api.py`) gain an optional `logic: Optional[LogicSchema]` field, where `LogicSchema` has `operator`, `value`, and `target_question_id`.
- Publish validator (already validates `config`) extends to validate the rules above for every question with logic set.
- `POST /api/responses/{id}/submit` accepts an optional `path: list[UUID]` body field. When present, the server trims the response's `Answer` set to only rows whose `question_id` is in the path before marking complete.
- `Answer` write path (`PUT /api/responses/{id}/answers/{question_id}`) snapshots `question_logic` alongside the existing snapshot fields.

## Testing

- Creator: can set, edit, and clear a rule on short_text and multiple_choice questions. Publish rejects invalid rules (missing target, backward target, unknown target).
- Respondent: a matched rule jumps to the expected question; a non-matched rule falls through to the next by position. Going back and changing the triggering answer re-routes forward correctly. A skipped required question does not block submit. On submit, answers for questions no longer on the path are dropped from the server response record.
- Snapshot: editing logic on a published form does not affect in-flight responses.

## Decisions

- **Action:** jump-to-question only. No end-form. Per-question visibility via the `hidden` flag (see Hidden questions section).
- **Rule direction:** source-based, stored on the answering question.
- **Rules per question:** exactly one.
- **Condition shape:** single condition, single operator, single value.
- **Operators:** `equals`, `not_equals`.
- **Supported field types (MVP):** `short_text` and `multiple_choice`. Others deferred.
- **Target direction:** forward-only (target `position` > source `position`).
- **Required on skipped questions:** auto-bypassed.
- **Stale answers:** dropped on submit, based on the final traversed path.
- **Progress bar:** static (answered / total), may not reach 100% when questions are skipped.
- **Versioning:** logic frozen into `Form.published_questions` at publish and `Response.questions_snapshot` at response start; per-answer `question_logic` snapshot on `Answer`.
- **Creator UI placement:** inline collapsible "Logic" section per question card in the form builder. No separate rules panel. "Hidden" checkbox sits next to "Required" on the same card.
- **Hidden questions:** `hidden: boolean` on Question, default false. Skipped by position-based traversal, still reachable via explicit jump. No publish validation for dead/all-hidden forms.

## Implementation checklist

Tracked here so progress is visible in-doc. Tick items as they land.

### Backend (Django + Ninja)

- [ ] Add nullable `logic` `JSONField` to `Question` in `core/models.py`.
- [ ] Add `question_logic` snapshot field to `Answer` in `core/models.py`.
- [ ] Generate and apply migration for the two new fields.
- [ ] Add `LogicSchema` (`operator`, `value`, `target_question_id`) in `core/api.py`.
- [ ] Add `logic: Optional[LogicSchema]` to `QuestionIn` and `QuestionOut`.
- [ ] Include `logic` in the snapshot written to `Form.published_questions` at publish time.
- [ ] Include `logic` in `Response.questions_snapshot` written at response start.
- [ ] Snapshot `question_logic` on answer save (`PUT /api/responses/{id}/answers/{question_id}`), alongside the existing snapshot fields.
- [ ] Extend the publish validator: for each question with `logic`, reject if `operator` / `value` / `target_question_id` missing, target question not found, or target `position` not greater than source.
- [ ] Extend `POST /api/responses/{id}/submit` to accept optional `path: list[UUID]`; on submit, delete `Answer` rows whose `question_id` is not in `path`, then run required-question validation only against questions in `path`.
- [ ] Backend tests: model field round-trip, publish validator rejections, answer snapshot captured, submit trimming behaviour, required bypass on skipped questions.

### Frontend (React + TypeScript)

- [ ] Extend the `Question` / `Answer` TypeScript types to include `logic` and `question_logic`.
- [ ] Form builder: add a collapsible "Logic" section inside each question card, below the type-specific config.
- [ ] Supported types (`short_text`, `multiple_choice`): render operator select (`equals` / `is not`), value control (text input for short_text, choice dropdown for multiple_choice), and target question dropdown filtered to forward-only positions and showing label + type icon.
- [ ] Unsupported types: render the section header plus the note "Logic isn't supported on this field type yet," no controls.
- [ ] Empty state collapsed header: "No logic. Respondents continue to the next question."
- [ ] Surface publish validation errors on the offending question card (inline, same pattern as existing config errors).
- [ ] `FormFlow` (`frontend/src/components/form-flow.tsx`): introduce a path stack of visited question ids.
- [ ] `FormFlow`: on advance, evaluate the current question's `logic` against the just-saved answer and compute the next question id (target if matched, next by `position` otherwise).
- [ ] `FormFlow`: back button pops the stack.
- [ ] `FormFlow`: when an earlier answer is changed and the respondent advances, truncate the stack at that question and re-evaluate forward.
- [ ] `FormFlow`: send the final `path` array on submit.
- [ ] `FormFlow`: skip required-validation for questions not on the current path.
- [ ] Playwright E2E (`frontend/e2e/`): creator sets a rule and publishes; respondent hits the matching branch; respondent hits the non-matching branch; back-navigation plus answer change reroutes; stale answer is dropped server-side on submit.

### Cross-cutting

- [ ] Update `docs/questions/short-text.md` and `docs/questions/multiple-choice.md` to note logic support.
- [ ] Verify publish / discard round-trip preserves `logic` on published and discarded states.
- [ ] Manual smoke: build a short form with one rule, publish, respond through both branches, confirm response view shows only path answers.
- [ ] Clean up the unused `core/migrations/0002_flow.py` and `core/migrations/0003_remove_form_flow_published_flow.py` if they are still untracked and unrelated to this work.
