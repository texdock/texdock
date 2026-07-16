# Test Results: Pilot Batch 1

## REL-001: ErrorController handleApiError

```
ErrorController
  handleApiError
    when headers have NOT been sent
      ✔ should send 404 for NotFoundError
      ✔ should send 429 for TooManyRequestsError
      ✔ should send 403 for ForbiddenError
      ✔ should send 500 for unknown errors
    when headers HAVE been sent
      ✔ should NOT call sendStatus for NotFoundError
      ✔ should NOT call sendStatus for TooManyRequestsError
      ✔ should NOT call sendStatus for ForbiddenError
      ✔ should NOT call sendStatus for unknown errors
      ✔ should not throw "headers already sent" error
    error classification
      ✔ should set warn level for NotFoundError
      ✔ should set error level for unknown errors
      ✔ should log the error fields

12 passing
```

### Pre-fix failure evidence
Tests "when headers HAVE been sent" all failed with:
```
AssertionError: expected true to equal false
```
Confirming `sendStatus` was called even when `res.headersSent === true`.

## BUG-004: LatexRunner run count

```
LatexRunner
  runLatex
    normally
      ✔ should run the latex command
      ✔ should record the stdout and stderr
      ✔ should not record cpu metrics
    with a different compiler
      ✔ should set the appropriate latexmk flag
    with time -v
      ✔ should record cpu metrics
    with an .Rtex main file
      ✔ should run the latex command on the equivalent .tex file
    with a flags option
      ✔ should include the flags in the command
    with the stopOnFirstError option
      ✔ should set the appropriate flags
    latex run count detection (TeXLive 2022+ stdout)
      ✔ should detect run count from stdout when only stdout has run info
      ✔ should detect run count from stderr (legacy TeXLive 2021)
      ✔ should prefer stdout over stderr when both have run info
      ✔ should return 0 when neither stdout nor stderr have run info

12 passing
```

### Pre-fix failure evidence
Tests "stdout only" and "stdout priority" failed with:
```
AssertionError: expected +0 to equal 2
```
Confirming run count was 0 when only stdout had run info.

## BUG-005: ResourceWriter minted regex

```
ResourceWriter
  isExtraneousFile - minted directory regex
    ✔ should NOT delete files in _minted/ (plain, no suffix)
    ✔ should NOT delete files in _minted-main/ (with jobname suffix)
    ✔ should NOT delete files in foo/_minted/ (nested, no suffix)
    ✔ should NOT delete files in foo/_minted-project/ (nested, with suffix)
    ✔ should NOT delete plain .pygtex files
    ✔ should NOT delete plain .pygstyle files
    ✔ should NOT delete non-pygtex files in plain _minted/ directory
    ✔ should NOT delete non-pygtex files in nested _minted/ directory
    ✔ should NOT delete _mintedfoo/ files with .pygtex extension
    ✔ should NOT delete foo_minted/ files with .pygtex extension
    ✔ should delete non-minted files without special extensions
    ✔ should delete plain _minted (not a directory path)

12 passing
```

### Pre-fix failure evidence
Tests "non-pygtex files in plain _minted/" failed with:
```
AssertionError: expected true to equal false
```
Confirming files in plain `_minted/` were incorrectly marked for deletion.
