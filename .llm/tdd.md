# TDD Process

Follow this cycle strictly for every feature. Never skip phases.

```
RED → GREEN → REFACTOR
 ↑__________________|
```

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

## Test Naming Convention

```
should [expected behavior] when [condition]
```

Examples:
- `should return false when ranges are disjoint`
- `should throw InvalidTimeRangeError when start equals end`
- `should return true when ranges partially overlap`

---

## Test Structure (AAA)

Every test follows Arrange → Act → Assert on separate lines for readability — no inline comments, no collapsing into one line.

```typescript
it('should calculate total when coupon applied', () => {
  const cart = new Cart();
  const coupon = new Coupon('10OFF', 10);
  const result = cart.withCoupon(coupon).total;
  expect(result).toBe(90);
});
```

---

## Test Isolation & Immutability

- **No `let` in tests.** Use `const` factory functions to produce fresh instances per test.
- Never use `beforeEach` to assign shared mutable state — factories are the pattern:

```typescript
const makeCart = () => new Cart([{ price: 100 }]);

it('should return true when item exists', () => {
  const cart = makeCart();
  const result = cart.hasItems();
  expect(result).toBe(true);
});
```

- Each test must be fully independent — no shared state between tests.

---

## Rules

- **One phase at a time.** Never write implementation while writing tests.
- **Immutability.** Prefer `const`, `readonly`, and immutable data structures everywhere — in tests and in production code.
- **Functional over imperative.** Prefer `map`/`filter`/`reduce` over `for`/`while` loops. Prefer pure functions over stateful procedures.
- **Symmetry check.** If a spec lists symmetric cases (e.g. `a.overlaps(b) === b.overlaps(a)`), include them explicitly.
- **No skipping lint.** Run `npm run lint` after GREEN to catch style issues before refactor.
- **Verification gap.** The agent that writes code must also run the verification commands from the spec — do not self-certify without executing them.
- **Test behaviour, not internals.** Assert observable outputs; never reach into private state.
- **Smallest failing test first.** Write one case at a time in RED — don't batch unrelated assertions.
