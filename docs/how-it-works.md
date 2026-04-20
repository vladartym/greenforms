# How Greenforms works

A Typeform-style form builder. Creators build forms, respondents answer one question per screen.

## Stack

The app is a Django backend with a React single-page frontend. One Django app (`core`) holds all the models and API routes.

- Django + Django Ninja for typed JSON APIs
- React SPA (Vite + TypeScript + React Router)
- Tailwind v4 + shadcn/ui
- SQLite for persistence
- Django session auth for creators, anonymous for respondents

## Models

Five models total, four ours and one from Django. Each form owns its questions; each response owns its answers.

- `User` (Django built-in): the creator. Respondents don't get one.
- `Form`: owned by a creator. Has a draft state and a frozen published copy.
- `Question`: belongs to a form. Has `type`, `label`, `required`, `position`, and a JSON `config`.
- `Response`: one respondent's attempt. Status is `draft` or `completed`, resumable via `cookie_id`.
- `Answer`: one value for one question in one response. Shape depends on question type.

## Lifecycle

The path from blank form to readable response. Publishing is the moment a form becomes visible to the public.

- Creator signs up, creates a form in `draft`
- Adds questions, edits, reorders
- Publishes: title and questions get frozen
- Shares the public URL
- Respondent opens it, answers one screen at a time
- Submits
- Creator reads the responses

## Publishing

Publishing is how creators make a form public without exposing their live drafts. The frozen copy lives on the Form itself.

- Triggered by `POST /api/forms/{id}/publish`
- Copies current title and questions into `Form.published_title` and `Form.published_questions`
- Sets `published_at` and clears `has_unpublished_changes`
- Respondents only ever see this frozen copy, never the draft
- Editing the form after publish flips `has_unpublished_changes` back on

## Responding

Respondents open the public URL and answer anonymously. Their progress is tied to a cookie, so they can close the tab and come back later.

- `POST /api/responses` starts a response with a fresh `cookie_id`
- `PUT /api/responses/{rid}/answers/{qid}` saves each answer as they go
- `POST /api/responses/{rid}/submit` marks it `completed` and runs required-field validation
- Each respondent gets their own locked-in set of questions (see Snapshots)

## Snapshots

Snapshots are frozen copies of the question, saved at the moment they matter. Questions can change; answers can't. So we save a copy of the question next to the answer, and history stays readable.

Think of each snapshot as a receipt. The store's menu can change, but your receipt still shows what you ordered that day.

- **Publish snapshot** on `Form` (`published_title`, `published_questions`): frozen when the creator publishes. Keeps respondents off the live draft.
- **Start snapshot** on `Response` (`questions_snapshot`): frozen when a respondent begins. Protects them from mid-session republishes.
- **Write snapshot** on `Answer` (`question_label`, `question_type`, `question_position`, `question_config`): frozen when the answer is saved. Keeps the answer readable even if the question is later edited or deleted.

### Why it matters

Without snapshots, editing a question rewrites history for every past response.

- Before: Q is "What's your favorite color?", Alice answers "Red"
- Creator edits Q to "What's your favorite animal?"
- Without snapshot: "What's your favorite animal?: Red" (nonsense)
- With snapshot: "What's your favorite color?: Red" (correct)

## Admin

All three snapshot layers are readable in Django admin as readonly fields. The naming convention tells you at a glance what's live and what's frozen.

- Form change page shows `published_title`, `published_questions`, `published_at`, `has_unpublished_changes`
- Response change page shows `questions_snapshot`
- Answer change page shows `question_label`, `question_type`, `question_position`, `question_config`
- Anything prefixed `published_*`, `questions_snapshot`, or `question_*` is frozen; everything else is live

## More detail

- Product scope: [`prd/01-overview.md`](./prd/01-overview.md)
- Data model: [`prd/04-data-model.md`](./prd/04-data-model.md)
- Architecture: [`prd/05-architecture.md`](./prd/05-architecture.md)
- Question types: [`questions/`](./questions/)
