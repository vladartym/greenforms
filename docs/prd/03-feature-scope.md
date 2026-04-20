# 3. Feature scope

## MVP

The minimum we ship and can demo end-to-end.

### Creator
- Sign up / sign in (Django auth).
- See a list of the creator's own forms.
- Create, rename, edit, duplicate, and delete a form.
- Edit a form's questions: stacked vertical cards, drag to reorder.
- Mark any question as required.
- Publish a form (draft → published; only published forms have a working share URL). Publish validates each question's config (e.g. choice lists are non-empty, scale bounds make sense).
- Discard pending changes on a published form to revert to the last-published version.
- Preview a form as a respondent before publishing.
- View completed responses for a form in a card or table view.

### Field types (13)

Full per-type specs live in [`docs/questions/`](../questions/). Palette overview:

- **Short text** — single-line input.
- **Long text** — multi-line input.
- **Multiple choice** — radio or checkbox list via an `allow_multiple` toggle.
- **Email** — short text with email-format validation.
- **Dropdown** — single-select picker for long option lists.
- **Number** — numeric input with optional bounds and integer / step constraints.
- **Phone number** — masked input guiding a callable phone format.
- **File upload** — single-file uploader with size / type limits.
- **Date** — ISO calendar date, optional min / max.
- **Time** — 24-hour time of day, optional min / max / step.
- **Linear scale** — bounded integer scale (e.g. 1-5, 0-10 NPS).
- **Rating** — fixed 1–5 star rating.
- **Ranking** — drag-to-order list of choices.

### Respondent
- Open a form via its public share URL.
- Answer one question at a time (OQPS); navigate back and forward.
- Each answer is persisted to the server on advance so nothing is lost mid-flow.
- Submit on the final question; generic thank-you screen.
- Required questions block forward navigation until answered.

## Stretch

Build if time permits, after MVP is solid.

- **Logic / branching.** "If answer to Q3 is X, skip to Q5." Touches the data model (conditional next-question rules) and both UIs (creator-side rule editor, respondent-side traversal).
- **CSV export of responses.** Download button on the responses page.
- **Cross-session resume.** Cookie-backed draft so a respondent can close the tab and pick up later (infra exists, UX not wired up).
- **Drop-off visibility.** Show in-progress drafts with a "last question reached" marker alongside completed responses.

## Out of scope

Deliberately not in this iteration.

- Teams, multi-creator forms, role-based permissions.
- Embeds, webhooks, third-party integrations, external email notifications.
- Payments, paywalls, response quotas.
- Customizable welcome and thank-you screens.
- Field types beyond those listed above (yes/no, matrix, signature, payment, wallet connect, etc.).
- Production deployment, observability, scale work.

## Decisions

- **Field palette:** 13 types covering text, choice, numeric, date / time, and specialised inputs. See [`docs/questions/`](../questions/) for per-type specs.
- **Required-field validation:** MVP.
- **Publish workflow:** MVP — draft → published with config validation; discard reverts to the last-published snapshot.
- **Form duplication:** MVP.
- **Preview:** MVP — creators can walk through the form as a respondent before publishing.
- **Logic / branching:** stretch, after MVP.
- **CSV export:** stretch.
- **Cross-session resume / drop-off visibility:** stretch.
- **Out-of-scope categories:** teams/permissions, integrations, payments, custom welcome/thank-you screens, additional field types, production concerns.
