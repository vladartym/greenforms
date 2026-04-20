# 1. Overview

## What

Greenforms is a form builder. Questions appear one at a time, respondents answer at their own pace, and creators get a clean list of responses per form. It's generic — no vertical, no assumptions about what the form is for — but opinionated about how it feels: minimal, restrained, product-focused.

## Why one-question-per-screen

Long, scrolling forms have well-documented drop-off problems — respondents see the full length up-front and abandon. The one-question-per-screen pattern (popularized by Typeform) hides length, creates a sense of forward motion, and is measurably better for completion. Greenforms commits to this as a core product decision, not a rendering option: it shapes the data model (questions have explicit order, navigation is a primary concern) and the respondent UI (full-screen, single-focus, keyboard-driven).

## The product position

Two forces pull against each other in the brief:

- **Generic, fully customizable** — flexible question types, any ordering, no vertical bias.
- **Apple-polished, minimal** — restrained, considered; product-like rather than tool-like.

The resolution: a **small, well-considered palette** of field types that handles any form. Fewer knobs, each one well-designed. Google Forms flexibility, Typeform polish, Apple restraint.

## Who uses it

- **Creators** sign in to manage their forms — build, edit, share, review responses. Standard session-based auth (Django's built-in user / session machinery — full stack rationale lives in Section 5).
- **Respondents** answer anonymously via a public URL. If a creator wants to capture identity, they add an email or name *question* to the form itself — the product doesn't force it at the auth layer.

## Success criterion

> A creator can build a mixed-field-type form and share its public URL in **under two minutes**.

That's the single headline Section 1 holds itself to. Other qualities — frictionless respondent flow, browsable responses, one-command local setup — are MVP expectations (see Section 3), not Section 1 success criteria.

## Non-goals

Deliberately out of scope for this iteration:

- Teams, sharing forms between creators, role-based permissions.
- Third-party integrations — embeds, webhooks, Zapier, email notifications to external addresses.
- Payments, paywalls, response quotas.
- Production deployment, observability, scale work.

## Decisions

- **Product pattern:** one question per screen, visible progress, keyboard-navigable.
- **Scope:** generic form builder; no vertical targeting.
- **Aesthetic:** Apple-minimal — a small, considered palette over many knobs.
- **Creator auth:** standard session-based login. Creators have accounts; forms belong to a creator.
- **Respondent auth:** respondents are always anonymous at the app layer. Identity capture is the creator's choice, expressed as form questions.
- **Success criterion:** creator builds and shares a form in under two minutes.
