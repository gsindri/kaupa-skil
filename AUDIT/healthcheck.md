# Repository Healthcheck

## Findings

| Category | File/Area | Issue | Evidence | Suggested Fix | Priority |
|---------|-----------|-------|----------|---------------|----------|
| Security | `supabase/migrations/...b633a3.sql` | RLS policy `System can manage jobs` allows `FOR ALL USING (true)` | see policy lines 183-194 | Restrict policy to service role and limit operations | P0 |
| Correctness | `src/contexts/AuthProvider.tsx` | Sign-in sets `sb-session-active` but sign-out never clears it | lines 60-80,155-179 | Remove session key on sign-out and broadcast logout | P0 |
| Security | `pnpm audit` | esbuild <=0.24.2 moderate vulnerability | `pnpm-audit.log` | upgrade to >=0.25.0 | P1 |
| Correctness | `src/components/compare/EnhancedComparisonTable.tsx` | Uses `mockCartItem` and `any` types in production code | lines 48-74 | Replace mock data with real cart items and add interfaces | P1 |
| Maintainability | various (`any` usage) | Multiple `any` types across services and utils | search results | Introduce proper interfaces and enable strict TS options | P1 |
| Performance | build output | Main JS bundle 1.54 MB, exceeds 500 kB warning | `build.log` | Code-split heavy modules (e.g., recharts) | P2 |
| Dependency hygiene | project | Unused deps: dotenv, @tailwindcss/typography, @vitest/coverage-v8, autoprefixer, postcss | `depcheck.log` | remove or use unused dependencies | P2 |
| Testing/CI | Vitest coverage | Coverage not generated; tests run but no report | `test.log` | configure Vitest coverage reporter | P2 |
| A11y | UI Drawer component | Missing DialogTitle causes accessibility warning in test | `test.log` | add `<DialogTitle>` or `aria-label` | P2 |

## Top Risks (P0)

1. **Overly permissive RLS for jobs** – allows any role to manage jobs. *Mitigation:* restrict policy to service role and define explicit operations.
2. **Session flag not cleared on logout** – `sb-session-active` remains in sessionStorage, risking stale sessions across tabs. *Mitigation:* remove flag on sign-out and broadcast logout.

## Architecture Notes

- Routes defined in `src/router.tsx` cover dashboard, quick order, cart, compare, suppliers, pantry, price-history, discovery, admin, settings, delivery, and auth flows.
- Global providers: `AuthProvider`, `BasketProvider`, `LanguageProvider`, `SettingsProvider`, `ComparisonContext` under `src/contexts/`.
- State storage: `userPrefs` store in `src/state/userPrefs.ts` plus context providers syncing via `BroadcastChannel` and localStorage.

## Metrics

- **TypeScript**: no errors (`typecheck.log` empty) but strict mode disabled.
- **ESLint**: no warnings (`eslint.log` empty) due to relaxed rules.
- **Unit tests**: 61 passed, 1 skipped (`test.log`). Coverage not produced.
- **E2E tests**: all 3 skipped (`playwright.log`).
- **Bundle size**: main JS `1.54 MB`, CSS `92.86 kB` (`build.log`).
- **Dependencies**: 1 moderate vulnerability (`pnpm-audit.log`); 5 unused deps (`depcheck.log`).
- **A11y**: axe run failed (missing chromedriver) (`axe-dashboard.log`).

## Suggested Next Steps

1. Lock down Supabase RLS policies and rotate affected credentials.
2. Implement robust logout handling and cross-tab sync.
3. Introduce TypeScript strict mode and resolve `any` usage.
4. Remove unused dependencies and enable lint rules for `no-explicit-any`, `no-unused-vars`.
5. Configure coverage reporting and integrate into CI.
6. Set up axe/playwright a11y tests once chromedriver is available.
7. Investigate large bundle size; code-split heavy libraries.

