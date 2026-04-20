# 2. Users & core UX

## Roles

- **Creator** — signs in to build, edit, share, and review forms they own.
- **Respondent** — answers a form via a public URL. No account.

## Creator flow

1. Sign in.
2. Land on a list of the creator's forms, with a "New form" action.
3. Open a form to edit. Questions appear as a stacked vertical list of cards — one question per card (label, type, settings). Reorder by drag.
4. Forms start as **drafts**. The share URL only goes live after the creator publishes the form.
5. From the form list (or the form itself), the creator can view completed responses for that form.

## Respondent flow

1. Open the form's share URL — straight to Q1, no welcome screen.
2. Answer one question at a time. Can navigate **back and forward** between questions.
3. Each answer is persisted to the server as the respondent advances, so nothing is lost mid-flow.
4. On final submit, the response is marked complete. Generic thank-you screen.

## Decisions

- **Creator landing:** list of the creator's forms.
- **Builder UI:** stacked vertical cards; drag to reorder.
- **Publish state:** explicit publish step; drafts are not reachable by respondents.
- **Respondent navigation:** back and forward allowed until submit.
- **Welcome / end screens:** none customizable in v1 — jump to Q1, generic thank-you.
- **Answer persistence:** each advance writes the answer to the server; full session resume across tabs is out of scope.
