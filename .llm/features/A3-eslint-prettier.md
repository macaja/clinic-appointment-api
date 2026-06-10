# A3 — ESLint 9 (flat) + Prettier

**Epic:** A — Scaffold · **Branch:** `feat/a3-eslint-prettier` · **Depends on:** A2

> Read `.llm/plan.md` for architectural context if needed.

## Goal
Lint + format the codebase with ESLint 9 **flat config** and Prettier, integrated so they don't
fight (eslint-config-prettier disables stylistic rules; eslint-plugin-prettier reports format
diffs as lint errors).

## Files to create
- **`eslint.config.mjs`** — flat config array:
  - ignores: `dist`, `node_modules`, `coverage`.
  - `typescript-eslint` recommended config (import `tseslint from 'typescript-eslint'`).
  - `globals.node` + `globals.jest` languageOptions; `sourceType: module`,
    `parserOptions.projectService: true` (or `project: ./tsconfig.json`).
  - `eslint-plugin-prettier/recommended` last so Prettier wins formatting.
  - Pragmatic rule relaxations for a Nest app: allow `@typescript-eslint/no-explicit-any` as
    warn, `no-unused-vars` as error with `argsIgnorePattern: '^_'`.
- **`.prettierrc`** — `{ "singleQuote": true, "trailingComma": "all", "printWidth": 100,
  "semi": true }`.
- **`.prettierignore`** — `dist`, `coverage`, `node_modules`, `*.md` optional.

Already present in `package.json`: deps `eslint`, `typescript-eslint`, `eslint-config-prettier`,
`eslint-plugin-prettier`, `globals`, `prettier`; scripts `lint`, `lint:fix`, `format`,
`format:check`; `lint-staged` config.

## Acceptance criteria
- [ ] `npm run lint` exits 0 (no source yet, or only config).
- [ ] `npm run format:check` exits 0.
- [ ] Introducing a deliberate format error makes `npm run lint` fail (then revert).

## Verification
```bash
npm run lint
npm run format:check
```

## On completion
Commit: `A3: ESLint 9 flat config + Prettier`.
Run `make review`, then merge `feat/a3-eslint-prettier` into `main` (`--no-ff`).
