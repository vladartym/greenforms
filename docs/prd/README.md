# Greenforms — PRD

Greenforms is a conversational, one-question-per-screen form builder. This folder is the source of truth for what we're building and the design decisions behind it.

Each section is its own document so it can be read, edited, and referenced independently.

## Sections

1. [Overview](./01-overview.md) — what we're building and why
2. [Users & core UX](./02-users-and-ux.md) — roles and key flows
3. [Feature scope](./03-feature-scope.md) — MVP, stretch, out-of-scope
4. [Data model](./04-data-model.md) — entities, relationships, storage trade-offs
5. [Architecture & stack](./05-architecture.md) — stack choice, folder layout
6. [API design](./06-api-design.md) — endpoints / actions, request & response shapes
7. [Testing & quality](./07-testing.md) — what we test and what we don't
8. [Open questions](./08-open-questions.md) — design problems still on the table
9. [Conditional logic](./09-conditional-logic.md): minimal jump-to-question rules

## How to read this

Each section ends with a **Decisions** block. That's the contract — anything outside it is context, rationale, or alternatives we considered.

For the *journey* behind those decisions — what we considered, why we chose — see [`../decisions.md`](../decisions.md).
