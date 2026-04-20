# 5. Architecture & stack

## Stack

- **Backend:** Django, with **Django Ninja** for typed API endpoints.
- **Page routing & rendering:** **React Router** in a single-page app. Django serves a static HTML shell at every non-API path; React Router handles client-side routing.
- **Frontend:** React (Vite + TypeScript).
- **Persistence:** SQLite.
- **Auth:** Django session auth (the SPA reads/sends the CSRF token via the `XSRF-TOKEN` cookie / `X-XSRF-TOKEN` header).
- **Build / styling:** Vite + Tailwind.

## How a request flows

1. User hits any non-API URL (e.g. `/`, `/form/123`, `/f/abc`). Django serves the same SPA shell template (`templates/base.html`) which loads the Vite-built React bundle.
2. React Router matches the URL to a page component.
3. The page fetches its own data from a Django Ninja endpoint (e.g. `GET /api/forms/123`) and renders.
4. Page-level interactions (drag-reorder a question, save an answer, publish a form) call additional Django Ninja endpoints that return JSON.

Routing is split: Django owns `/api/*` (and `/admin/*`); React Router owns every page route in the browser.

## App layout

Single Django app named `core`.

```
greenforms/
  manage.py
  greenforms/            # Django project settings
  core/
    models.py
    views.py             # spa_shell only
    api.py               # Django Ninja routes (auth, forms, responses, public, me)
    urls.py              # catch-all -> spa_shell
  frontend/
    src/
      App.tsx            # React Router routes
      main.tsx           # mounts <App />
      pages/             # React page components
      components/
      lib/api.ts         # CSRF-aware fetch helpers
    vite.config.ts
    tailwind.config.js
  templates/
    base.html            # SPA shell (single <div id="app">)
```

## Decisions

- **Backend:** Django.
- **API layer:** Django Ninja.
- **Page rendering:** React SPA with React Router (Django serves a single shell template).
- **Frontend:** React.
- **Persistence:** SQLite.
- **Build / styling:** Vite + Tailwind.
- **App layout:** single Django app named `core`.
