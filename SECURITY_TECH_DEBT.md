# Security / Tech-Debt Notes

Running notes for follow-up work. Not urgent; tracked here so it isn't lost.

## 1. Remaining Dependabot moderates (artillery transitives)

After the security PRs (next/postcss in #3, vitest/prisma/stripe + `npm audit fix`
in #4), the repo is at **0 critical / 0 high**.

**33 moderate alerts remain**, all deep transitives of `artillery` (load-test
dev tool only, never in the production runtime path):

- `@opentelemetry/*` (many packages)
- `@sentry/node`
- `js-yaml`
- `lighthouse`

Fixing these requires a forced **`artillery` major bump** (`npm audit fix --force`),
which is risky for a dev-only tool and not worth it right now.

Options when revisited:
- Bump `artillery` to its latest major and re-run load tests.
- Or drop/replace `artillery` if load testing has moved elsewhere.
- Or accept/dismiss these moderates in Dependabot with a note.

## 2. Broken `.tsx` Vitest tests ("React is not defined")

Some component tests fail with `React is not defined`, e.g.:

- `src/test/e2e/checkout-component-integration.test.tsx`

**This is pre-existing** (confirmed failing on `main` under vitest 2, before the
vitest 3 bump in #4 — verified in a clean worktree). It is NOT a regression from
the dependency upgrades.

Why it's currently harmless: **CI does not run vitest.** The deploy workflow gates
are `npm run type-check` and `npm run build` only.

Likely root cause: JSX automatic-runtime config. `vitest.config.ts` uses
`@vitejs/plugin-react`, but these files seem to rely on a classic-runtime / global
`React`. Fix is probably one of:
- ensure `@vitejs/plugin-react` automatic JSX runtime applies to these test files, or
- add `import React from 'react'` where needed, or
- set esbuild `jsx: 'automatic'` for the test transform.

Action: fix the JSX runtime config so the component test suite is green, then
consider adding a `vitest run` step to CI to keep it green.
