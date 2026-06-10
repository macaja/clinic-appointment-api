---
name: typescript
description: |
  TypeScript best practices and patterns for this NestJS project. Covers type-safe patterns, strict configuration, generics, utility types, mapped/conditional types, the satisfies operator, and class-validator DTOs. Use when writing DTOs, domain types, guards, value objects, or any TypeScript code in this codebase.
version: 1.0.0
category: programming-languages
triggers:
  - typescript
  - ts
  - type-safe
  - generics
  - nestjs typescript
  - tsconfig
  - type guards
  - mapped types
  - conditional types
  - satisfies operator
tags:
  - typescript
  - type-safety
  - nestjs
  - immutability
  - functional
---

# TypeScript Skill

Build type-safe, immutable code with TypeScript 5.x and NestJS.

> **Stack:** TypeScript 5.x · Node.js 22 LTS · NestJS 11 · Jest · npm

## Project Commands

```bash
npm install
npm run typecheck   # tsc --noEmit
npm run lint        # eslint
npm test            # jest
npm run build       # nest build
make review         # lint + typecheck + test + build
```

## Type System Quick Reference

### Primitives and Unions

```typescript
type Status = 'pending' | 'approved' | 'rejected';

// Discriminated union — exhaustive, type-safe branching
type Result<T> =
  | { success: true; data: T }
  | { success: false; error: string };

const handle = <T>(result: Result<T>): T | null =>
  result.success ? result.data : null;
```

### Type Guards

```typescript
function isString(value: unknown): value is string {
  return typeof value === 'string';
}

type User  = { type: 'user';  name: string };
type Admin = { type: 'admin'; permissions: string[] };

const isAdmin = (p: User | Admin): p is Admin => p.type === 'admin';
```

### The `satisfies` Operator

Validates type conformance while preserving inferred literal types — prefer it over `as`:

```typescript
// Bad: assertion discards specificity
const config = { retries: 3 } as Record<string, number>;

// Good: validates shape, keeps literal type
const config = { retries: 3 } satisfies Record<string, number>;
```

## Generics

```typescript
// Constrained generic
function first<T extends { length: number }>(items: T[]): T | undefined {
  return items[0];
}

// API response wrapper
interface ApiResponse<T> {
  readonly data: T;
  readonly status: number;
}
```

## Utility Types

| Type | Purpose |
|------|---------|
| `Readonly<T>` | All properties immutable |
| `Partial<T>` | All properties optional |
| `Required<T>` | All properties required |
| `Pick<T, K>` | Select subset of keys |
| `Omit<T, K>` | Exclude subset of keys |
| `Record<K, V>` | Object with typed keys/values |
| `ReturnType<F>` | Extract function return type |
| `Awaited<T>` | Unwrap Promise type |

## Conditional & Mapped Types

```typescript
// Conditional: unwrap array element
type ArrayElement<T> = T extends (infer E)[] ? E : never;

// Mapped: make all properties readonly and non-nullable
type Strict<T> = { readonly [K in keyof T]-?: T[K] };
```

## Immutability Rules

- Use `const` for every binding — never `let` unless mutation is strictly unavoidable.
- Mark all class fields and interface properties `readonly`.
- Return new objects instead of mutating — prefer spread, `map`, `filter`, `reduce`.
- Use `as const` for literal tuples and fixed enums.

```typescript
// Bad
let items = [];
items.push(newItem);

// Good
const items = [...existingItems, newItem];
```

## Functional Style

Prefer expressions over statements, pure functions over procedures:

```typescript
// Bad
const result = [];
for (const x of items) {
  if (x.active) result.push(x.name);
}

// Good
const result = items
  .filter(x => x.active)
  .map(x => x.name);
```

## NestJS Patterns

### DTO with class-validator

```typescript
import { IsString, IsNotEmpty, IsISO8601 } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateAppointmentDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  readonly clinicianId: string;

  @ApiProperty()
  @IsISO8601({ strict: true })
  @IsNotEmpty()
  readonly start: string;
}
```

### Typed Service

```typescript
@Injectable()
export class AppointmentService {
  constructor(private readonly repo: AppointmentRepository) {}

  async findAll(): Promise<readonly Appointment[]> {
    return this.repo.findAll();
  }
}
```

## tsconfig Reference

Current project config: `tsconfig.json`

| Option | Value | Why |
|--------|-------|-----|
| `target` | `ES2022` | Node 22 supports it natively |
| `strict` | `true` | Catches null/undefined bugs |
| `experimentalDecorators` | `true` | Required for NestJS |
| `emitDecoratorMetadata` | `true` | Required for NestJS DI |
| `types` | `["jest","node"]` | IDE resolution for test globals |

## Common Mistakes

| Mistake | Fix |
|---------|-----|
| `any` | Use `unknown` and narrow with a guard |
| `as SomeType` | Use `satisfies` or a type guard |
| `let` for immutable binding | Use `const` |
| Enums | Use `const` literal unions |
| Mutating arrays/objects | Return new value with spread or `map` |
| Loops for transforms | Use `map`/`filter`/`reduce` |
| Not marking fields `readonly` | Add `readonly` to all class/interface fields |
