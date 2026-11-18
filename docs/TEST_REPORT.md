# Test Report — Briqen Creator Studio

**Date:** 2026-11-18
**Platform:** Windows 11, Node 22.x, npm 10.x

## Unit Tests (Vitest)

```
npx vitest run
```

**Result:** 72 tests passed, 0 failed

| Suite | Tests | Status |
|-------|-------|--------|
| `store.test.ts` — reorder | 5 | Pass |
| `store.test.ts` — adjustDuration | 5 | Pass |
| `store.test.ts` — updateScript | 3 | Pass |
| `store.test.ts` — retryGeneration | 5 | Pass |
| `store.test.ts` — generationSucceeded | 4 | Pass |
| `store.test.ts` — generationFailed | 4 | Pass |
| `store.test.ts` — approveCandidate | 4 | Pass |
| `store.test.ts` — setMediaType | 3 | Pass |
| `store.test.ts` — selectScene | 3 | Pass |
| `store.test.ts` — updateTitle | 3 | Pass |
| `store.test.ts` — reorderDrop | 4 | Pass |
| `store.test.ts` — replaceAsset | 4 | Pass |
| `store.test.ts` — full scenario | 4 | Pass |
| `selectors.test.ts` — existing | 15 | Pass |
| `selectors.test.ts` — selectSelectedScene | 3 | Pass |
| `selectors.test.ts` — selectActiveJob | 3 | Pass |

### Key Invariants Verified

- Reorder and trim never restart generation or mutate job state
- Retry snapshots current script and creates a fresh job; preserves all scene edits
- Generation failure preserves scene order, duration, script, and other scenes' approved assets
- Stale results (script edited during generation) marked `outdated`, never auto-approved
- Approval rejected when revisions mismatch or no candidate exists
- Export gate derived from all scenes having approved assets — not a mutable boolean

## End-to-End Tests (Playwright)

```
npx playwright test
```

**Result:** 9 tests passed, 0 failed

| # | Test | Status |
|---|------|--------|
| 1 | Initial state: Scene 1 approved, Scene 2 running, export disabled | Pass |
| 2 | Fail generation preserves all edits and Scene 1 approved asset | Pass |
| 3 | Retry creates new attempt with current script, preserves edits | Pass |
| 4 | Success marks as succeeded but does not auto-approve | Pass |
| 4b | Approve after success enables export | Pass |
| 5 | Reset restores initial state | Pass |
| 6 | Screenshot: generating state | Pass |
| 7 | Screenshot: failed state | Pass |
| 8 | No console errors during scenario | Pass |

## Production Build

```
npm run build
```

**Result:** Successful. 52 modules transformed, 253 KB JS + 19 KB CSS (gzipped: 79 KB + 5 KB).

## TypeScript

```
npx tsc --noEmit
```

**Result:** Zero type errors across all source and test files.
