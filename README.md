# Briqen Creator Studio — Scene Editor Prototype

A script-first scene editor for marketers: AI-assisted script, scenes, image/video generation, reorder/trim, and draft export.

Built for the Briqen AI Product Engineering internship exercise.

## Quick Start

```bash
npm install
npm run dev          # Vite dev server at localhost:5173
npm test             # Vitest unit tests (51 tests)
npm run build        # Production build
npm run pdf          # Generate submission PDFs (requires Playwright)
```

## Architecture

- **React 19** + **TypeScript** + **Vite** — modern build toolchain
- **Zustand** for state management with localStorage persistence
- **CSS Modules** with design tokens (CSS custom properties)
- **Vitest** (unit) + **Playwright** (e2e) for testing

## State Model

The editor separates two concerns:

1. **Project state** (user-editable): scene order, script text, media type, playback duration, approved assets
2. **Job state** (system-managed): generation attempts with immutable input snapshots, idempotency keys, and status tracking

Key invariants enforced by the store:
- Reorder and trim never restart generation
- Retry never mutates script, order, duration, or other scenes' approved assets
- Stale results (script edited during generation) are marked "outdated," never auto-approved
- Export gate is a derived selector, not a mutable boolean

## Design

Apple-inspired aesthetic with warm off-white canvas, lilac/iris accents, generously rounded surfaces, and refined typography. Three-zone desktop layout (script editor, 9:16 preview, scene inspector) with bottom storyboard strip. Responsive at 1440px, 768px, and 390px.

## Demo Controls

The prototype includes "Walk through the assignment" controls at the bottom of the storyboard:
- **1. Fail generation** — Simulates Scene 2 video generation failure
- **2. Complete retry** — Simulates successful completion

A `window.__briqenDemo` API is available for programmatic testing.

## What Is Simulated

- AI image/video generation (deterministic demo controls, no real API)
- Draft export (confirms eligibility, no MP4 rendering)
- Asset library (two sample replacements)

## Project Structure

```
src/
  types/           TypeScript data model
  state/           Zustand store, selectors, initial state
  components/      React components (CSS Modules)
  hooks/           Custom hooks (reduced motion, debounce)
__tests__/         Vitest unit tests + Playwright e2e
pdf/               PDF generation pipeline
docs/              AUDIT.md, TEST_REPORT.md, AI disclosure
final/             Generated PDFs and screenshots
```

## Submission

The 2-page PDF and AI appendix are generated from `pdf/submission.html` and `pdf/appendix.html`.

## License

This is a submission for the Briqen AI Product Engineering internship exercise.
