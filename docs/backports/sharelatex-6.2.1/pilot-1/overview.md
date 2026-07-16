# Pilot Batch 1: ShareLaTeX 5.5.8 → 6.2.1 Selective Backport

## Summary

| Metric | Value |
|--------|-------|
| Candidates | 3 |
| Commits | 3 |
| Files modified | 6 (3 production + 3 test) |
| Tests added | 31 |
| All tests passing | Yes |

## Candidates

### REL-001: handleApiError headers-sent guard
- **File:** `services/web/app/src/Features/Errors/ErrorController.js`
- **Commit:** `b87b18c`
- **Problem:** `handleApiError` called `res.sendStatus()` without checking `res.headersSent`, causing "Cannot set headers after they are sent" errors
- **Fix:** Added `const shouldSendErrorResponse = !res.headersSent` guard, matching the existing pattern in `handleError`
- **Tests:** 12 (4 headersSent=false + 5 headersSent=true + 3 error classification)

### BUG-004: LatexRunner stdout run count
- **File:** `services/clsi/app/js/LatexRunner.js`
- **Commit:** `10f347c`
- **Problem:** TeXLive 2022+ writes run count to stdout, but only stderr was checked, causing `latex-runs` metrics to always report 0
- **Fix:** Check stdout first, fall back to stderr, preserving backward compatibility
- **Tests:** 12 (4 new run count detection + 8 existing)

### BUG-005: Minted directory regex fix
- **File:** `services/clsi/app/js/ResourceWriter.js`
- **Commit:** `9333a1b`
- **Problem:** Regex `/(^|\/)_minted-[^\/]+\//` required hyphen suffix, causing plain `_minted/` directories to be deleted
- **Fix:** Changed to `/(^|\/)_minted(-[^\/]+)?\//` making suffix optional
- **Tests:** 10 new minted regex tests

## Verification

All tests pass in both CLSI and web services. No other files modified.
