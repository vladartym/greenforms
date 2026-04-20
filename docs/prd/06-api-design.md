# 6. API design

Django serves one SPA shell (`templates/base.html`) for every non-API path. React Router owns page routing in the browser; every data interaction goes through Django Ninja at `/api/...`. Request and response bodies are Pydantic schemas.

## SPA routes (React Router)

| Path | Page | Notes |
|---|---|---|
| `/` | `Home` / `Forms/Index` | Marketing home for anonymous visitors; form list when signed in |
| `/login`, `/signup` | `Auth/Auth` | Email + password |
| `/form/new` | — | Redirects to a freshly-created draft |
| `/form/:formId` | `Forms/Edit` | Builder (autosaves) |
| `/form/:formId/preview` | `Forms/Preview` | Walk the form as a respondent |
| `/form/:formId/responses` | `Forms/Responses` | Completed responses, card + table views |
| `/form/:formId/share` | `Forms/Share` | Copyable public link |
| `/f/:formId` | `Respond/Form` | Public respondent flow |

Public forms are reached via the form's UUID at `/f/:formId`.

## API (Ninja)

### Auth
- `POST /api/auth/signup` — create account (email + password)
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/me` — current user, or `401` if anonymous

### Forms (creator, session auth)
- `GET /api/forms` — list the creator's forms with response counts
- `POST /api/forms` — create a form
- `GET /api/forms/{id}` — form with its questions
- `PUT /api/forms/{id}` — replace title + full question list (used by autosave and reorder)
- `DELETE /api/forms/{id}`
- `PATCH /api/forms/{id}/rename` — rename only
- `POST /api/forms/{id}/publish` — validate per-type config and publish (captures title/questions snapshot)
- `POST /api/forms/{id}/discard` — revert pending changes to the last-published snapshot
- `POST /api/forms/{id}/duplicate` — clone as a new draft
- `GET /api/forms/{id}/responses` — completed responses for this form

### Public (no auth)
- `GET /api/public/forms/{id}` — published form + questions for the respondent flow

### Responses (no auth)
- `POST /api/responses` — start a response for a published form (returns `response_id`)
- `PUT /api/responses/{id}/answers/{question_id}` — upsert one answer (validated against the question's type and config)
- `POST /api/responses/{id}/submit` — enforce required-fields, mark completed

### Uploads (no auth)
- `POST /api/uploads?response_id=...&question_id=...` — multipart upload, 10 MB cap; returns URL, filename, size, mime type for the `Answer.value`

### Health
- `GET /api/ping`

## Auth & CSRF

- Django session auth for creators; respondents stay anonymous.
- CSRF token is readable by the SPA: `XSRF-TOKEN` cookie, sent back as `X-XSRF-TOKEN`. Helpers live in `frontend/src/lib/api.ts`.

## Validation & errors

- Pydantic schemas on every Ninja endpoint (request body + response); `extra="forbid"` is the default.
- Validation failures return `400` with a per-field `errors` payload the React pages render inline.
- Authorization failures return `403`; not-found returns `404`.

## Decisions

- **Page rendering:** React Router owns all page routes; Django serves one SPA shell.
- **Data plane:** Django Ninja for every request and mutation.
- **Question editing:** no per-question endpoints; the full form (title + questions + positions) is replaced via `PUT /api/forms/{id}`.
- **Validation:** Pydantic at the API boundary; extra fields rejected.
- **Optimistic UI:** none in MVP — React waits for the server response.
- **Public respondent URL:** `/f/:formId` using the form's UUID.
