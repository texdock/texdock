# Adversarial Code Review: Pilot Batch 1

**Reviewer:** Independent adversarial review (not construction agent)
**Date:** 2026-07-16
**Branch:** `backport/sharelatex-6.2.1-pilot-1`
**Commits:** `b87b18c`, `10f347c`, `9333a1b`

---

## A. Commit Verdict

```
b87b18c: PASS
10f347c: PASS
9333a1b: PASS
```

---

## B. Findings

### P0 (Blocks merge): None

### P1 (Required before merge): None

### P2 (Non-blocking)

| # | Commit | File | Finding |
|---|--------|------|---------|
| P2-1 | 10f347c | LatexRunnerTests.js | 4 new tests duplicate ~35 lines of setup each (CommandRunner stub, SandboxedModule.require, options object). Pre-existing `this.call()` helper isn't reusable because it needs different output fixtures. Acceptable for pilot batch; extract a factory if test count grows. |
| P2-2 | 9333a1b | ResourceWriterTests.js | New `beforeEach` at line 374 re-creates the full SandboxedModule with its own fs/UrlCache/Metrics stubs, duplicating the outer `beforeEach` at line 23. This is correct (singleOnly: true isolation) but means the test block doesn't share the outer module instance. Acceptable. |

---

## C. RED → GREEN Authenticity

| Candidate | Pre-fix failure | Failure reason | Post-fix | Authentic? |
|-----------|----------------|----------------|----------|------------|
| REL-001 | 4 tests fail | `sendStatus` called when `headersSent=true` (expected false, got true) | 12/12 pass | **YES** — tested against production code via SandboxedModule.require |
| BUG-004 | 2 tests fail | Run count = 0 when only stdout has run info (expected 2, got 0) | 12/12 pass | **YES** — tested against production code via SandboxedModule.require |
| BUG-005 | 2 tests fail | Non-pygtex files in `_minted/` marked for deletion (expected false, got true) | 52/52 pass | **YES** — tested `isExtraneousFile()` on production ResourceWriter |

**Methodology:** Each RED verification used `git checkout <parent> -- <file>` to revert the production file, ran the new tests against the reverted code, then `git checkout HEAD -- <file>` to restore. This is a genuine RED→GREEN proof — the tests run against the actual production module, not a mock or copy.

No `.only`, `.skip`, `focus`, or test count manipulation detected in any pilot batch test file.

---

## D. Upstream Consistency

| Candidate | 5.5.8 baseline | 6.2.1 fix | TeXDock implementation | Verdict |
|-----------|---------------|-----------|----------------------|---------|
| REL-001 | No guard in `handleApiError` | `const shouldSendErrorResponse = !res.headersSent` + wrap all `sendStatus` | Identical to 6.2.1 | **EXACT MATCH** |
| BUG-004 | `output?.stderr?.match(...)` only | `output?.stdout?.match(...) \|\| output?.stderr?.match(...)` | Identical to 6.2.1 | **EXACT MATCH** |
| BUG-005 | `/_minted-[^\/]+\//` | `/_minted(-[^\/]+)?\//` | Identical to 6.2.1 | **EXACT MATCH** |

**Intentionally excluded from backport (correct):**
- 6.2.1 adds `InvalidParamsError`, `InvalidRequestError`, `FileTooLargeError` to ErrorController — new error types, not bug fixes
- 6.2.1 converts ErrorController to ESM (`.mjs`) — not a bug fix
- 6.2.1 adds `isRunning()` helper to LatexRunner — new feature
- 6.2.1 adds `LatexMetrics` import — new feature

No upstream refactoring was copied. No unbackported API dependencies exist.

---

## E. Actual Re-run Tests

| Command | Exit | Pass | Fail | Time |
|---------|------|------|------|------|
| `cd services/web && NODE_PATH=.../node_modules npx mocha --timeout 10000 --exit test/unit/src/Errors/ErrorControllerTests.js` | 0 | 12 | 0 | 53ms |
| `cd services/clsi && NODE_PATH=.../node_modules npx mocha --timeout 10000 --exit test/unit/js/LatexRunnerTests.js` | 0 | 12 | 0 | 54ms |
| `cd services/clsi && NODE_PATH=.../node_modules npx mocha --timeout 10000 --exit test/unit/js/ResourceWriterTests.js` | 0 | 52 | 0 | 372ms |
| `cd services/clsi && NODE_PATH=.../node_modules npx mocha --recursive --timeout 15000 --exit test/unit/js` | 0 | 271 | 3* | 7s |

*3 failures are pre-existing: ContentCacheManager (EACCES), DockerRunner (missing dockerode). Not caused by pilot batch.

---

## F. Scope Audit

```
M  services/clsi/app/js/LatexRunner.js           (BUG-004)
M  services/clsi/app/js/ResourceWriter.js         (BUG-005)
M  services/clsi/test/unit/js/LatexRunnerTests.js (BUG-004)
M  services/clsi/test/unit/js/ResourceWriterTests.js (BUG-005)
M  services/web/app/src/Features/Errors/ErrorController.js (REL-001)
A  services/web/test/unit/src/Errors/ErrorControllerTests.js (REL-001)
```

6 files total. No package.json, yarn.lock, Dockerfile, docker-compose, server-ce, tools, or other services modified.

**Scope audit: CLEAN.**

---

## G. Docker Gate

```
FULL_IMAGE_BUILD:    NOT_RUN (pre-existing image texdock/sharelatex-web:latest used)
FULL_SMOKE:          NOT_RUN (Docker sandbox compose tested instead)
SANDBOX_WEB_BUILD:   NOT_RUN (pre-existing image used)
SANDBOX_TEXLIVE_BUILD: NOT_RUN (pre-existing image texdock/texlive:2026.1 used)
SANDBOX_SMOKE:       RUN — plain compile SUCCESS (status:success, PDF 13910 bytes)
SANDBOX_MINTED_SMOKE: RUN — compile FAILURE (test-input encoding issue, not code issue)
```

**Note:** Docker images were pre-built before this pilot batch. The sandbox compose started successfully, web service responded (302→/login), CLSI compiled a basic LaTeX project successfully. Minted compile failed due to test-input JSON encoding (newlines), not a code defect.

---

## H. Final Status

```
TEXDOCK-SELECTIVE-BACKPORT-PILOT-1-REVIEW:
CODE-PASS
MERGE-BLOCKED-PENDING-DUAL-MODE-VALIDATION
```

**Rationale:** Code review passes on all three candidates. RED→GREEN authenticity verified. Upstream consistency confirmed. Scope clean. However:

1. Docker images were NOT rebuilt from the modified source — they use pre-built images. The code changes are in the source tree but haven't been baked into a new image build.
2. Full deployment smoke test (both Full and Sandbox modes) with rebuilt images has not been performed.
3. Minted compile smoke test failed due to test-input encoding — the minted code path wasn't end-to-end verified.

**These changes must not be merged to main until Docker images are rebuilt and dual-mode smoke tests pass.**
