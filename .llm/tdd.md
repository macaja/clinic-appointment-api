# TDD Process

Follow this cycle strictly for every feature. Never skip phases.

---

## Phase 1 — RED

1. Read the spec's TDD cases (listed in each feature ticket).
2. Write **all** test cases in the spec file(s) before touching implementation.
3. Run `npm test` — tests **must fail** (compilation error or assertion failure). If they pass, something is wrong.
4. Do not write any implementation code in this phase.

---

## Phase 2 — GREEN

1. Write the **minimum** implementation to make the failing tests pass.
2. No extra logic, no premature abstractions, no features beyond what the tests demand.
3. Run `npm test` — all tests must pass before moving on.

---

## Phase 3 — REFACTOR

1. Clean up the implementation: naming, duplication, readability.
2. Run `npm test` after each change — tests must stay green.
3. Stop when the code is clear and the tests are green. Do not add new behaviour here.

---

## Rules

- **One phase at a time.** Never write implementation while writing tests.
- **Symmetry check.** If a spec lists symmetric cases (e.g. `a.overlaps(b) === b.overlaps(a)`), include them explicitly.
- **No skipping lint.** Run `npm run lint` after GREEN to catch style issues before refactor.
- **Verification gap.** The agent that writes code must also run the verification commands from the spec — do not self-certify without executing them.
