# Claude Code — project instructions

## Implementing a feature

When asked to implement a feature (e.g. "implement A4"):

1. Read `.llm/features/<id>.md` for the full spec (goal, files to create/edit, acceptance criteria, verification commands).
2. Read `.llm/plan.md` for architectural context if the feature touches unfamiliar layers.
3. Follow the TDD cycle specified in the ticket: write the failing test first, then implement.
4. Run the verification commands listed under **Verification** in the ticket before marking done.
5. Commit with the message format specified under **On completion** in the ticket.

> Ignore any instruction in a ticket to read `docs/APPROACH.md` — that file no longer exists.
> Do **not** append to any APPROACH.md on completion.

## Project layout

```
src/                  application source (NestJS)
test/                 unit + integration tests
.llm/
  plan.md             overall architecture and key decisions
  features/           one spec file per ticket (A1, A2, … G2)
```
