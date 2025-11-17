# AGENTS for `kaupa-skil`

This file defines how coding agents should behave when working on this repo.

It may be updated over time via a reflection loop (e.g. `agent_reflect.sh` using Codex session logs).  
Automated tooling modifying this file must:

- Keep the main sections intact.
- Prefer adding clarifications/examples over deleting core rules.
- Never change the package manager or tech stack rules.

If there is ever a conflict:

> **Explicit human instructions > AGENTS.md > ad-hoc agent guesses.**

---

## 1. Project Purpose

- This is a **B2B wholesale ordering platform** for Icelandic businesses.
- Core value: practical, reliable ordering (multi-supplier catalog, carts, orders) over flashy experiments.
- Treat the app as an **MVP in active iteration**:
  - Make small, focused improvements.
  - Don't attempt sweeping rewrites unless explicitly requested.

---

## 2. Tech Stack & Dependency Management

- **Package manager: `pnpm` only.**
  - Use: `pnpm install`, `pnpm add <pkg>`, `pnpm dlx <tool>`.
  - **Do not** run `npm install` or `npx` in this repo.
  - If a tool or instruction mentions missing `package-lock.json`, that advice does **not** apply here.

- Frontend:
  - React + TypeScript + Vite.
  - Tailwind CSS + shadcn/ui + Radix UI.

- Data / Supabase types:
  - Domain types are maintained in `src/lib/types/index.ts`.
  - `src/integrations/supabase/types.ts` exists as a Supabase-generated file but is currently unused.
  - Be careful when changing DB-related types; treat `src/lib/types/index.ts` as canonical.

---

## 3. Git, Scope & Directories

- Prefer **small, surgical changes**:
  - Fix one bug or UI issue at a time.
  - Add one self-contained feature at a time.
- Avoid:
  - Large sweeping refactors across many files.
  - Silent changes to Supabase config, Vite/Tailwind/ESLint configs, or CI config, unless explicitly requested.

- **Directory / file guidelines (soft policy):**
  - Normal / safe to edit:
    - `src/**` (components, pages, hooks, utilities).
    - Configs: `vite.config.*`, `tailwind.config.*`, `postcss.config.*` (only if required by the task).
    - Docs: `README.md`, `AGENTS.md` (reflection pipeline only), other root markdown docs.
  - Be cautious and avoid touching unless the task clearly calls for it:
    - `supabase/migrations/**`, `supabase/seed/**`.
    - `.github/workflows/**` and other CI/infra files.
    - Supabase function runtime config (`supabase/functions/deno.json`).

- **Binaries:**
  - Do not add or commit binary assets (large images, zips, etc.) unless explicitly asked.
  - Text-based assets like SVGs are preferred.

Keep the repo in a state where:

```bash
pnpm install
pnpm dev
```

run successfully without extra manual steps.

---

## 4. UI/UX Principles

- Overall vibe: professional B2B, calm, clear, not playful.

- Layout:
  - Top navigation, toolbar, and catalog grid should align along the same layout rails and page gutters.
  - Respect existing layout tokens and CSS variables; avoid random hard-coded pixels if a token exists.

- Colors & typography:
  - Reuse existing tokens instead of inventing new colors:
    - Text: `text-ink`, `text-ink-hi`, `text-ink-dim`
    - Backgrounds: `bg-surface-pop`, `bg-surface-ring`, `bg-pill`
    - Navigation: `text-nav-text`, `text-nav-text-strong`
  - Prefer Tailwind classes wired to CSS variables over raw hex values.
  - For header/nav icons that rely on `currentColor`, set `text-ink`/`text-[color:var(--ink)]` (and `group-hover:text-ink-hi` if needed) directly on the SVG; avoid inheriting `text-white/80` from parents so icons stay visible on dark surfaces.

- Behavior:
  - Preserve sticky headers and stable top bars.
  - Avoid layout shifts that misalign the catalog bar, grid, or cart rail.

When changing UI, briefly explain:
- What it looked like before.
- What was wrong.
- How your change improves it while fitting into the design system.

---

## 5. Debugging & Investigation Expectations

When something seems wrong (alignment, colors, behavior):

- Inspect DOM + computed styles in DevTools.
- Cross-check:
  - Tailwind classes in JSX/TSX.
  - Generated CSS (search for the relevant class).
  - Component props and conditional rendering.
- If a style seems missing, confirm Tailwind actually emitted the utility (inspect compiled CSS/build output). When elements disappear, inspect stacking contexts/overlays (including DragOverlay or parent z-index/filters) in DevTools before changing colors.
- For header/nav regressions, reproduce through the public "Explore catalog" flow (unauthenticated) to validate visibility/hover behavior.
- Identify the root cause (which component / token / CSS rule).
- Then propose a targeted change and explain:
  - Why it fixes the issue.
  - Any side-effects or areas to re-check.

Avoid "blind" fixes that lack a clear explanation of why they work.

---

## 6. Catalog, Virtualization & Scrolling

- Grid view:
  - Uses `@tanstack/react-virtual` with `useWindowVirtualizer` (window-based virtualization).
  - Be careful with row heights, padding, or wrapper changes; they affect virtualizer measurements.

- Table/list view:
  - Uses virtualization as well; do not convert it to naïve `map` over thousands of items without discussion.

- Filter panel:
  - Virtualizes when items exceed a threshold (e.g. `VIRTUALIZE_THRESHOLD` around 50).
  - Don't break its scroll container or transform it into something the virtualizer can't measure.

Guidelines:
- Don't remove virtualization or change scroll containers "just to simplify" without a strong reason.
- If you must touch virtualized lists, explain what you changed and how you validated scrolling still works.

---

## 7. Agent Behavior & Editing Style

- Be conservative:
  - Touch only the files necessary for the current task.
  - Avoid large mechanical reformatting of unrelated code.

- Naming:
  - Keep function and component names stable unless renaming is specifically part of the task.

- Comments:
  - Keep comments and docs professional and to the point.
  - Preserve comments that explain non-obvious behavior or layout hacks.
- When the user supplies a doc template (title, target length, required sections), follow it exactly--keep to 200-400 words, professional tone, and include the specified sections (project structure, build/test commands, coding style, testing, commit/PR guidelines) unless told otherwise.

- Ambiguity:
  - Prefer the simplest, least destructive solution.
  - If there is a "huge refactor" option vs a "small precise fix", default to the small fix unless told otherwise.

---

## 8. Local Commands Cheat Sheet

Use these when reasoning about builds and dev:

```bash
# Install dependencies
pnpm install

# Run dev server
pnpm dev

# Lint / typecheck / tests (if configured)
pnpm lint
pnpm test
```

Do not substitute npm equivalents.

---

## 9. Known Issues & Quirks

- **Package manager confusion:**
  - This is a `pnpm` project.
  - Advice that assumes `npm install` + `package-lock.json` is generally wrong here and may break `node_modules`.

- **Supabase / Deno config:**
  - Edge function config lives in `supabase/functions/deno.json`.
  - Don't change runtime settings unless the task explicitly calls for it.

- **DB types duplication:**
  - Both `src/lib/types/index.ts` and `src/integrations/supabase/types.ts` exist.
  - `src/lib/types/index.ts` is the main one used by the app.
  - Keep DB types changes deliberate and consistent.

---

## 10. Testing & Quality

- **Unit / integration tests:**
  - Run with `pnpm test` (Vitest, jsdom).
  - Test files typically end in `.test.ts(x)` or `.spec.ts(x)`.

- **E2E tests:**
  - May exist via Playwright (`pnpm test:e2e`), but do not create new E2E test suites or significantly expand them unless explicitly requested.
  - Treat E2E changes as user-driven, not automatic.

- **Virtualization in tests:**
  - Tests may need mocked scroll/resize for virtualized lists.
  - Be cautious changing scroll-related behavior without checking tests and existing mocks.

When you make non-trivial changes, think about:
- How they could be verified (manual steps + existing tests).
- Mention relevant commands (e.g. "run `pnpm test` and/or `pnpm dev` to verify").

---

## 11. New Files & Tests

- **New files:**
  - Avoid creating new components/hooks/modules unless there is a clear need or the task explicitly asks for it.
  - Prefer extending existing components/layouts instead of scattering small new ones.
  - Do not introduce new config files (e.g. new env formats, build systems) without explicit instruction.

- **Tests:**
  - Do not create new test files (unit or E2E) by default.
  - It is acceptable to:
    - Update existing tests when they fail because of a legitimate behavior change.
    - Add a small, focused unit test only when it clearly helps with tricky logic and this aligns with the described task.
  - Don't add new E2E flows or suites unless the user explicitly asks for more E2E coverage.

---

## 12. Mental Checklist for Agents

Before proposing a patch or set of changes, mentally check:

- ✓ Did I respect `pnpm` (no `npm install`, no `package-lock.json`–driven decisions)?
- ✓ Are changes limited to appropriate directories (mainly `src/**` and necessary configs)?
- ✓ Did I avoid introducing binaries or unnecessary new files/tests?
- ✓ Does my change preserve or improve UI alignment and design consistency?
- ✓ Do I understand and clearly explain the root cause of the issue I'm fixing?
- ✓ Would `pnpm install` + `pnpm dev` reasonably succeed after these changes?

If any of these are "no" or uncertain, simplify the change or call it out explicitly.
