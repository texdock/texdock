# Remaining Risks: Pilot Batch 1

## Scope Limitation

This pilot batch only covers 3 of 35 identified backport candidates. Passing these 3 does NOT imply the remaining 32 candidates are safe to backport.

## Specific Risks

### REL-001 (handleApiError)
- **Risk level:** LOW
- **Mitigation:** Guard matches existing `handleError` pattern; no new code paths
- **Edge case:** If `next()` is needed for connection closure (not currently called in `handleApiError`), this is unchanged from 5.5.8 behavior

### BUG-004 (LatexRunner stdout run count)
- **Risk level:** LOW
- **Mitigation:** Stdout check added before existing stderr check; fallback preserves old behavior
- **Note:** TeXDock has custom watchdog code in LatexRunner that differs from upstream; this change does not interact with it

### BUG-005 (Minted directory regex)
- **Risk level:** LOW
- **Mitigation:** Single character change (`?`); regex tested against all edge cases
- **Note:** The `.pygtex`/`.pygstyle` extension check provides secondary protection for minted files regardless of directory path

## Not Verified in This Batch

- Docker image builds (Full and Sandbox modes)
- End-to-end compilation smoke tests
- Integration with TeXDock-specific features (watchdog, sandbox mode)
- Performance impact

These verifications are required before merging to main.

## Upstream Changes Not Backported

The following changes in 6.2.1 ErrorController were NOT backported (out of scope):
- `InvalidParamsError` handling (new error type from zod validation)
- `FileTooLargeError` handling (new error type)
- `InvalidRequestError` handling with zod validation error rendering
- ESM module conversion (.js → .mjs)

These are features, not bug fixes, and belong in later batches if needed.
