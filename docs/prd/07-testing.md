# 7. Testing & quality

We ship with a thin Playwright E2E suite that walks the full stack, happy path only. Lint and TypeScript stay on for the cheap safety nets.

## What we have

- **Playwright E2E** — one happy-path test per feature, real Django + SQLite, no mocks. Run via `/tests-run` or `npm run test:e2e` from `frontend/`.
- **Ruff** — lint + format for Python.
- **Prettier** — format for React + Tailwind.
- **TypeScript** — compile-time checking, free.
- **Pydantic schemas in Ninja** — request/response validation at the API boundary.

## Current coverage (8 tests)

- `auth.spec.ts` — signup, logout, log back in; unauthenticated form route redirects to login.
- `form-lifecycle.spec.ts` — signup, build form, publish, respond publicly, view response.
- `publish-workflow.spec.ts` — edit-after-publish shows Changes pill, discard reverts; public form serves published snapshot not unsaved draft.
- `form-management.spec.ts` — rename, duplicate, delete from the index.

## Convention for new features

One happy-path `test(...)` per feature, added to the matching spec or a new `frontend/e2e/<feature>.spec.ts`. Use the `/tests-create` skill. No edge-case matrix, no mocks, no page object model.

## What we don't have (yet)

- No backend unit tests (E2E covers the API).
- No validation edge cases, no auth failure tests, no network-failure simulation.
- No CI wiring.
- No React component tests.
