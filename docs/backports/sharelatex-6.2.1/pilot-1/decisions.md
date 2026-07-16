# Design Decisions: Pilot Batch 1

## REL-001: handleApiError headers-sent guard

**Decision:** Add `const shouldSendErrorResponse = !res.headersSent` at function entry, wrap all `sendStatus` calls.

**Rationale:**
- Matches the exact pattern already used in `handleError` (line 24 of the same file)
- Single guard variable avoids repeated `!res.headersSent` checks
- No change to error classification logic or logging

**Not changed:**
- Error type detection (instanceof checks)
- Logger level assignments
- Module exports

## BUG-004: LatexRunner stdout run count

**Decision:** Check `output.stdout` first, fall back to `output.stderr`.

**Rationale:**
- TeXLive 2022+ writes `Run number N of pdflatex` to stdout
- TeXLive 2021 and earlier writes to stderr
- Checking stdout first gives priority to modern TeXLive
- Falling back to stderr preserves backward compatibility

**Not changed:**
- Latexmk error detection (still checks stdout for `Latexmk: Errors`)
- Compile command construction
- Timing metrics extraction
- Watchdog functionality (TeXDock-specific)

## BUG-005: Minted directory regex

**Decision:** Change `(-[^\/]+)` to `(-[^\/]+)?` making the suffix optional.

**Rationale:**
- `_minted/` is a valid minted cache directory (no jobname suffix)
- `_minted-main/` is also valid (with jobname suffix)
- The trailing `/` is preserved to avoid matching `_minted` as a file
- No false positives: `_mintedfoo/` still doesn't match (no hyphen)

**Not changed:**
- `.pygtex` and `.pygstyle` extension checks (separate protection)
- Other extraneous file detection rules
- File deletion logic
