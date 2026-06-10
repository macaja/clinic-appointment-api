# A2 — TypeScript, Nest & Jest config

**Epic:** A — Scaffold · **Branch:** `feat/a-scaffold` · **Depends on:** A1

> Read `.llm/plan.md` for architectural context if needed.

## Goal
Wire TypeScript, the Nest CLI build, and the Jest test runner so later tickets have a compiler
and a runnable test harness.

## Files to create
- **`tsconfig.json`** — `module: nodenext`/`commonjs`, `target: ES2022`, `experimentalDecorators: true`,
  `emitDecoratorMetadata: true`, `strict: true`, `esModuleInterop: true`,
  `forceConsistentCasingInFileNames: true`, `skipLibCheck: true`, `outDir: ./dist`,
  `baseUrl: ./`, `declaration: false`, `sourceMap: true`. Include `src`, `test`.
- **`tsconfig.build.json`** — extends `tsconfig.json`, excludes `node_modules`, `dist`, `test`,
  `**/*.spec.ts`.
- **`nest-cli.json`** — `{ "$schema": "https://json.schemastore.org/nest-cli", "collection":
  "@nestjs/schematics", "sourceRoot": "src", "compilerOptions": { "deleteOutDir": true } }`.
- **`jest.config.js`** — ts-jest, `testEnvironment: node`, `rootDir: .`, `roots: ['<rootDir>/src']`,
  `testRegex: '.*\\.spec\\.ts$'`, `transform` via `ts-jest`, `moduleFileExtensions:
  ['ts','js','json']`, `collectCoverageFrom: ['src/**/*.ts','!src/**/*.spec.ts','!src/main.ts']`,
  `coverageDirectory: 'coverage'`, `passWithNoTests: true`. (Integration uses a separate config
  added in G1 — `test/integration/jest-integration.config.js`.)

## Acceptance criteria
- [ ] `npm run typecheck` exits 0 (no `src` yet → trivially passes).
- [ ] `npx jest` runs and reports no tests without error (`passWithNoTests`).
- [ ] `npm run build` is a no-op-safe (nest build) — OK if it warns about empty src; A5 adds source.

## Verification
```bash
npm run typecheck
npx jest
```

## On completion
Commit: `A2: TypeScript, Nest & Jest config`.
