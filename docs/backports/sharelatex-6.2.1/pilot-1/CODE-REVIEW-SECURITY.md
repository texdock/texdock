# Code Review: Security Validation Batch

**Reviewer:** MiMoCode (code-review-and-quality)
**Date:** 2026-07-16
**Scope:** 2 commits, 4 files (2 production + 1 new module + 1 test), 84 lines changed

---

## 1. Correctness

### SEC-001: SanitizeControlCharacters

**PASS.** The regex `/[\u0000-\u001F\u007F-\u009F\u200B\u200C\u200D\u2060\uFEFF]/g` is identical to upstream 6.2.1 (`Sanitize.mjs:4-5`). The replacement logic escapes each match to `\uXXXX` text representation, matching upstream behavior exactly.

**CJS conversion correctness:**
- Upstream uses `export function` (ESM) → TeXDock uses `function` + `module.exports` (CJS) — correct
- Upstream uses `char =>` (arrow) → TeXDock uses `function (char)` (function expression) — functionally identical
- Upstream uses template literal `` `\\u${code.toString(16).padStart(4, '0')}` `` → TeXDock uses string concatenation `'\\u' + code.toString(16).padStart(4, '0')` — functionally identical
- `// @ts-check` and JSDoc omitted — acceptable since TeXDock doesn't use TypeScript for this file

**Edge cases verified:**
- `typeof` guard throws TypeError on non-string input — matches upstream
- Empty string returns empty string — correct (regex with `g` flag on empty string returns empty)
- Null bytes, control chars, zero-width spaces all escaped correctly — verified by 11 unit tests

### SEC-001: AuthenticationManager Integration

**PASS.** Two call sites added:

1. `authenticate()` (line 119-121): `if (typeof password === 'string') { password = sanitizeControlCharacters(password) }` — matches upstream 6.2.1 exactly. The `typeof` guard handles edge case where password might not be a string (e.g., undefined from malformed request).

2. `setUserPasswordInV2()` (line 320): `password = sanitizeControlCharacters(password)` — no `typeof` guard, matches upstream. Password is always a string at this point (validated by caller).

**Blast radius verified:** Both `authenticate()` and `setUserPasswordInV2()` are the correct entry points. `setUserPassword()` delegates to `setUserPasswordInV2()`, so all password-setting paths are covered.

### SEC-004: update.doc Validation

**PASS.** The guard `if (update.doc && update.doc !== docId)` matches upstream 6.2.1 (`WebsocketController.js:579`) exactly. The forced assignment `update.doc = docId` normalizes the field. The `CodedError` is already imported at line 11 of the file.

**Logic analysis:**
- `update.doc && update.doc !== docId` — only rejects when `update.doc` is present AND differs from `docId`. If `update.doc` is absent (undefined), the condition is falsy and execution proceeds to `update.doc = docId`. Correct.
- No disconnect on this error (unlike the auth error above) — matches upstream. The client stays connected but the update is rejected.

---

## 2. Readability & Simplicity

### SEC-001: Sanitize.js

**Good.** 18 lines, single function, clear purpose. The eslint disable/enable comments around the regex are appropriate (the regex intentionally uses control characters). No unnecessary complexity.

### SEC-001: AuthenticationManager.js

**Good.** The sanitization calls are minimal — 2 lines in `authenticate()`, 1 line in `setUserPasswordInV2()`. They don't disrupt the existing control flow. The `typeof` guard in `authenticate()` is clear about its intent.

### SEC-004: WebsocketController.js

**Good.** The 7-line addition (validation + error + normalization) is self-contained. The error message is descriptive. The placement after auth check and before `update.meta` initialization is logical.

---

## 3. Architecture

**PASS.** All changes follow existing patterns:

- `Sanitize.js` is placed in `infrastructure/` alongside other utility modules (`Response.js`, `Validation.js`, etc.)
- `sanitizeControlCharacters` is called at the system boundary (authentication entry points), not deep in the call chain
- `update.doc` validation is placed in the same function that processes the update, not in a separate middleware

No new abstractions, no new dependencies, no circular imports.

---

## 4. Security

### SEC-001

**Positive security impact.** The change prevents:
- bcrypt 72-byte truncation at null bytes
- Hash collisions from invisible characters
- Password confusion via zero-width spaces

**No security regressions.** The sanitization is applied BEFORE bcrypt hashing, ensuring consistent hashes. Existing passwords without control chars are unaffected.

**Backward compatibility risk (documented):** Passwords containing control chars will fail to login after deployment. This is a known, documented trade-off.

### SEC-004

**Positive security impact.** The change prevents cross-document operation injection via WebSocket.

**No security regressions.** The validation is additive — it rejects malformed updates without changing the behavior of valid updates.

---

## 5. Performance

**PASS.** No performance concerns:

- `sanitizeControlCharacters`: Single regex pass over password string. Passwords are short (< 100 chars typical). Negligible overhead.
- `update.doc` validation: Single string comparison. Negligible overhead.

---

## Summary

| Axis | Verdict |
|------|---------|
| Correctness | PASS |
| Readability | PASS |
| Architecture | PASS |
| Security | PASS (positive impact) |
| Performance | PASS |

### Findings

| # | Severity | Finding | Action |
|---|----------|---------|--------|
| — | — | No findings | — |

### Verdict

**APPROVE.** Both changes are minimal, correct, and match upstream 6.2.1 exactly. SEC-001 has a documented backward compatibility risk (control-char passwords), but this is an intentional security improvement. SEC-004 is a straightforward validation guard with no side effects.

### Upstream Consistency

| Change | TeXDock | Upstream 6.2.1 | Match |
|--------|---------|----------------|-------|
| Sanitize regex | `[\u0000-\u001F\u007F-\u009F\u200B\u200C\u200D\u2060\uFEFF]` | Same | EXACT |
| Sanitize escape | `\\u` + code.toString(16).padStart(4, '0') | Template literal | FUNCTIONAL |
| authenticate() guard | `if (typeof password === 'string')` | Same | EXACT |
| setUserPasswordInV2() call | `password = sanitizeControlCharacters(password)` | Same | EXACT |
| update.doc guard | `if (update.doc && update.doc !== docId)` | Same | EXACT |
| update.doc normalization | `update.doc = docId` | Same | EXACT |
