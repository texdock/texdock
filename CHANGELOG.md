# Changelog

All notable changes to TeXDock will be documented in this file.

Format based on [Keep a Changelog](https://keepachangelog.com/).

---

## [0.2] - 2026-07-16

### Base Upgrade

Upgraded from **ShareLaTeX 5.5.8** to **ShareLaTeX 6.2.1**.

Previous base: `sharelatex/sharelatex:5.5.8`
Current base: `sharelatex/sharelatex:6.2.1`

### Selective Backport (Pilot Batch + Security Validation)

The following fixes were selectively backported from ShareLaTeX 6.2.1:

| ID | Title | Service | Type |
|----|-------|---------|------|
| REL-001 | handleApiError headers-sent guard | web | Bug fix |
| BUG-004 | LatexRunner stdout run count detection | clsi | Compatibility fix |
| BUG-005 | Minted directory regex fix | clsi | Bug fix |
| SEC-001 | Password control character sanitization | web | Security fix |
| SEC-004 | OT update.doc field validation | real-time | Security fix |

**SEC-001 Note:** After deployment, existing passwords containing control characters will need to be reset.

### Docker Image Changes

- `Dockerfile-windows-fonts` now produces `texdock/sharelatex-full:latest` (renamed from `-fonts`)
- Build instructions updated with tag-and-rename step
- Added Chinese README (`README.zh-CN.md`)

### Bug Fixes

- **ErrorController:** `handleApiError` now checks `res.headersSent` before sending responses, preventing "Cannot set headers after they are sent" crashes
- **LatexRunner:** Detects LaTeX run count from stdout first (TeXLive 2022+), falls back to stderr (legacy)
- **ResourceWriter:** Plain `_minted/` directories are now preserved (previously only `_minted-<jobname>/` was recognized)

### Security Fixes

- **AuthenticationManager:** Control characters in passwords are now escaped to `\uXXXX` text before bcrypt hashing, preventing null-byte truncation and hash collisions
- **WebsocketController:** `update.doc` field is now validated against `docId` in `applyOtUpdate`, preventing cross-document operation injection

### Documentation

- Updated README.md with build instructions and feature list
- Added README.zh-CN.md (Chinese)
- Updated .env.example with sandbox compile settings

---

## [0.1] - 2026-06-06

### Initial TeXDock Release

- Based on ShareLaTeX 5.5.8
- Chinese UI defaults (zh-CN)
- Full TeX Live image with CJK fonts
- Sandbox compile mode with sibling TeXLive containers
- Docker Compose deployment support
