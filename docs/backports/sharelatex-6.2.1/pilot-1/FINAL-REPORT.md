# TEXDOCK-SELECTIVE-BACKPORT-PILOT-1: READY_FOR_REVIEW

## A. Pre-construction State

| Item | Value |
|------|-------|
| Starting main HEAD | `f0cb51d95dee6c840134cb0ab7ac7d818a5fdd55` |
| Backup tag | `texdock-before-selective-backport-pilot-1` → `f0cb51d` |
| Construction branch | `backport/sharelatex-6.2.1-pilot-1` |
| Branch HEAD | `9333a1b358d14b16e12698688e8a258c2caad88b` |

## B. Candidate Details

### REL-001: handleApiError headers-sent guard

| Aspect | Detail |
|--------|--------|
| 5.5.8 problem | `handleApiError` calls `res.sendStatus()` without checking `res.headersSent` |
| 6.2.1 fix | Adds `const shouldSendErrorResponse = !res.headersSent` and wraps all `sendStatus` calls |
| TeXDock implementation | Identical to 6.2.1; applied to existing `.js` CJS module |
| Pre-fix test failure | 4 tests failed: `sendStatus` called when `headersSent=true` |
| Post-fix test result | 12/12 passing |
| Commit | `b87b18c` |

### BUG-004: LatexRunner stdout run count

| Aspect | Detail |
|--------|--------|
| 5.5.8 problem | Only checks `output.stderr` for run count; TeXLive 2022+ writes to stdout |
| 6.2.1 fix | Checks `output.stdout` first, falls back to `output.stderr` |
| TeXDock implementation | Identical to 6.2.1; added comments marking TeXLive version compatibility |
| Pre-fix test failure | 2 tests failed: run count = 0 when only stdout has run info |
| Post-fix test result | 12/12 passing |
| Commit | `10f347c` |

### BUG-005: Minted directory regex fix

| Aspect | Detail |
|--------|--------|
| 5.5.8 problem | Regex `/(^|\/)_minted-[^\/]+\//` requires hyphen suffix; plain `_minted/` deleted |
| 6.2.1 fix | Changed to `/(^|\/)_minted(-[^\/]+)?\//` making suffix optional |
| TeXDock implementation | Identical to 6.2.1; single character addition |
| Pre-fix test failure | 2 tests failed: non-pygtex files in `_minted/` incorrectly deleted |
| Post-fix test result | 52/52 passing (ResourceWriter full suite) |
| Commit | `9333a1b` |

## C. Dual-mode Verification

| Verification | Status |
|-------------|--------|
| Full image build | **NOT PERFORMED** - requires Docker build environment |
| Full compile smoke | **NOT PERFORMED** - requires running containers |
| Full minted smoke | **NOT PERFORMED** - requires running containers |
| Sandbox web build | **NOT PERFORMED** - requires Docker build environment |
| Sandbox TeXLive build | **NOT PERFORMED** - requires Docker build environment |
| Sandbox compile smoke | **NOT PERFORMED** - requires running containers |
| Sandbox minted smoke | **NOT PERFORMED** - requires running containers |

**Note:** Unit tests pass. Full Docker-based verification must be performed before merging to main.

## D. Scope Audit

### Modified files (6 total)

```
services/web/app/src/Features/Errors/ErrorController.js      (REL-001)
services/web/test/unit/src/Errors/ErrorControllerTests.js     (REL-001)
services/clsi/app/js/LatexRunner.js                           (BUG-004)
services/clsi/test/unit/js/LatexRunnerTests.js                (BUG-004)
services/clsi/app/js/ResourceWriter.js                        (BUG-005)
services/clsi/test/unit/js/ResourceWriterTests.js             (BUG-005)
docs/backports/sharelatex-6.2.1/pilot-1/                      (documentation)
```

### NOT modified (scope verification)

- package.json
- yarn.lock / package-lock.json
- Dockerfile*
- docker-compose*
- server-ce/
- tools/
- Other services/
- Other libraries/

**Scope audit: CLEAN** - no files outside candidate scope were modified.

## E. Residual Risks

1. **Pilot batch test passing does NOT imply other 32 candidates are safe to backport.** Each candidate requires independent verification.
2. **Docker-based verification not performed.** Unit tests pass but integration testing is required.
3. **TeXDock-specific code (watchdog in LatexRunner) not tested with these changes.** The changes are in code paths that don't interact with the watchdog.
4. **The 6.2.1 ErrorController has additional error types** (InvalidParamsError, FileTooLargeError, InvalidRequestError) that were NOT backported as they are features, not bug fixes.

## F. Post-construction State

- **Merged to main:** NO
- **Security Validation Batch implemented:** NO
- **CLSI concurrency batch implemented:** NO
- **Data-integrity batch implemented:** NO
- **Current status:** READY_FOR_REVIEW only

Three independent commits on branch `backport/sharelatex-6.2.1-pilot-1` awaiting review.
