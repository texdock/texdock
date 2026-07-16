# Code Review: Pilot Batch 1 — ShareLaTeX 5.5.8 → 6.2.1 Selective Backport

**Reviewer:** MiMoCode (code-review-and-quality)
**Date:** 2026-07-16
**Scope:** 3 commits, 6 files (3 production + 3 test), 382 lines changed

---

## 1. Correctness

### REL-001: handleApiError headers-sent guard

**PASS.** The fix adds `const shouldSendErrorResponse = !res.headersSent` at the top of `handleApiError` and wraps every `res.sendStatus()` call. This matches the exact pattern already used in `handleError` (line 24 of the same file). The error classification logic (instanceof checks, logger level assignments) is unchanged.

Verified against upstream 6.2.1 (`ErrorController.mjs:130-158`): the guard pattern is identical. The only intentional differences from 6.2.1 are:
- 6.2.1 adds `InvalidParamsError` and `InvalidRequestError` handling (new error types from zod validation) — correctly excluded as features, not bug fixes
- 6.2.1 uses ESM (`export default`) — correctly kept as CJS

**Tests:** 12 tests covering headersSent=false (4), headersSent=true (5), and error classification (3). Pre-fix failure was verified. All pass after fix.

### BUG-004: LatexRunner stdout run count

**PASS.** The fix checks `output.stdout` first, falls back to `output.stderr`. The regex `/^Run number \d+ of .*latex/gm` is unchanged. The fallback chain is correct: `stdout.length || stderr.length || 0`.

Edge case analysis:
- `output?.stdout?.match(...)?.length` returns `undefined` if stdout is `""` (no match) — falls through to stderr correctly
- `output?.stdout?.match(...)?.length` returns `0` if match is empty (impossible with this regex) — `||` operator handles it
- `output` is `null`/`undefined` — optional chaining returns `undefined`, falls through to `0`

**Tests:** 4 new tests covering stdout-only, stderr-only, stdout-preference, and no-match. Pre-fix failure was verified. All pass after fix.

### BUG-005: Minted directory regex

**PASS.** Changed `(-[^\/]+)` to `(-[^\/]+)?` making the suffix optional. The trailing `/` is preserved, preventing false matches on `_minted` as a filename.

Regex analysis:
- `/(^|\/)_minted(-[^\/]+)?\//` matches: `_minted/`, `_minted-main/`, `foo/_minted/`, `foo/_minted-project/`
- Does NOT match: `_minted` (no slash), `_mintedfoo/` (no hyphen), `_minted-` (empty suffix after hyphen)
- The `[^\/]+` after the hyphen ensures at least one character in the suffix when present

**Tests:** 12 new tests with table-driven coverage. Pre-fix failure was verified. All pass after fix.

---

## 2. Readability & Simplicity

### REL-001

**Good.** The `shouldSendErrorResponse` variable name is identical to the one in `handleError`, creating internal consistency. The guard pattern is minimal and clear.

**Nit:** The `handleApiError` function uses single-line `if (shouldSendErrorResponse) res.sendStatus(N)` while `handleHandleError` uses block-style `if (shouldSendErrorResponse) { ... }`. This is a pre-existing inconsistency (the 6.2.1 upstream uses single-line in `handleApiError`). Acceptable as-is since the block style in `handleError` is needed for multi-statement bodies.

### BUG-004

**Good.** The inline comments `// TeXLive 2022 and later` and `// TeXLive 2021 and earlier` clarify the intent of each branch without over-explaining.

### BUG-005

**Good.** Single character change. The regex remains readable.

### Tests

**Issue (Required):** The LatexRunner tests have significant boilerplate duplication. Each of the 4 new tests creates its own `CommandRunner` stub, `LatexRunner` instance, and calls `runLatex` with the same options object. This is ~35 lines of setup per test that could be extracted into a helper.

The existing tests in the file already share a `this.call()` helper defined in the outer `beforeEach`. The new tests don't use it because they need different `CommandRunner` outputs. This could be solved by parameterizing `this.call()` or using a factory function.

**Severity:** Nit. The duplication is contained within the test file and doesn't affect production code. The tests are correct and readable. However, if more LatexRunner tests are added in future batches, this pattern will compound.

The ResourceWriter tests are cleaner — the `beforeEach` re-creates the module with minimal setup, and each test is a single `expect()` call.

---

## 3. Architecture

**PASS.** All three changes follow existing patterns:

- REL-001: Matches `handleError`'s guard pattern in the same file
- BUG-004: Follows the existing `|| fallback || 0` pattern used elsewhere in the codebase
- BUG-005: Minimal regex modification, no structural changes

No new modules, no new dependencies, no new abstractions. The changes are surgical and contained.

**Module boundary:** Each change stays within its owning service (web, clsi). No cross-service coupling introduced.

---

## 4. Security

**PASS.** No security concerns:

- REL-001: The guard prevents a crash (unhandled exception in Express error handler). This is a reliability improvement, not a security change. The error logging is unchanged.
- BUG-004: Metrics-only change. Run count is used for `stats['latex-runs']` which feeds into monitoring. No behavioral impact on compilation.
- BUG-005: Directory preservation change. Prevents unnecessary cache deletion. No injection surface (regex operates on internal file paths, not user input).

No secrets, no auth changes, no input validation changes.

---

## 5. Performance

**PASS.** No performance concerns:

- REL-001: One additional boolean check per `handleApiError` call. Negligible.
- BUG-004: One additional regex match attempt on stdout before falling to stderr. Negligible.
- BUG-005: Regex character change from `[^\/]+` to `(-[^\/]+)?`. Negligible.

No N+1 patterns, no unbounded operations, no synchronous blocking.

---

## Summary

| Axis | Verdict |
|------|---------|
| Correctness | PASS |
| Readability | PASS (1 nit) |
| Architecture | PASS |
| Security | PASS |
| Performance | PASS |

### Findings

| # | Severity | Finding | Action |
|---|----------|---------|--------|
| 1 | Nit | LatexRunner test boilerplate duplication | Consider extracting a helper in future batches |

### Verdict

**APPROVE.** All three changes are minimal, correct, and follow existing patterns. The backported code matches upstream 6.2.1 for the targeted fixes. Tests adequately cover the bug scenarios with pre-fix failure evidence. The single nit (test boilerplate) does not block merge.

### Pre-merge checklist

- [x] All Critical issues: none
- [x] All Required changes: none
- [x] Tests pass: 12 + 12 + 52 = 76 total
- [x] Build verification: unit tests pass (Docker integration not performed — documented as limitation)
- [x] Scope audit: only 6 files modified, all within candidate scope
