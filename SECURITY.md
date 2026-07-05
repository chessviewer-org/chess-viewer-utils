# Security Policy

## Supported Versions

| Version | Status | Security Updates |
|---------|--------|-----------------|
| 1.x     | Active | Yes |

Only the latest minor of the current major receives security fixes.

## Security Properties

This package is a **zero-dependency utility library**. Its security surface is small:

- No network requests — all functions are pure transforms or static data
- No DOM access — works entirely in JavaScript/Node.js without `window` or `document`
- Input sanitization via `sanitizeInput()`, `sanitizeHexColor()`, `sanitizeFileName()`
- Prototype-pollution-safe JSON parsing via `safeJSONParse()` (reviver drops `__proto__`, `constructor`, `prototype` keys)
- FEN strings are length-capped at 93 characters before any parsing (`MAX_FEN_LENGTH`)
- SVG output escapes all attribute values to prevent XSS when embedded in HTML

## Reporting a Vulnerability

**Do not open a public GitHub issue for security vulnerabilities.**

### Option 1 — GitHub Security Advisory (preferred)

1. Go to the [Security tab](https://github.com/chessviewer-org/chess-viewer-utils/security)
2. Click **"Report a vulnerability"**
3. Fill in the private advisory form

### Option 2 — Direct Email

**To:** [contact@chessvision.org](mailto:contact@chessvision.org)  
**Subject:** `[SECURITY] chess-viewer-utils — <brief description>`

### What to include

- Type of vulnerability (XSS, prototype pollution, ReDoS, etc.)
- Affected version(s) and function(s)
- Steps to reproduce with a minimal code snippet
- Potential impact
- Proof of concept if available

### Response timeline

| Stage | Target |
|-------|--------|
| Initial acknowledgment | ≤ 48 hours |
| Severity assessment | ≤ 5 business days |
| Fix + patch release | ≤ 10 business days for high/critical |
| Public disclosure | After patch is released (coordinated) |

## Dependency Security

This package has **zero runtime dependencies**. Development dependencies are monitored by [Dependabot](.github/dependabot.yml) with weekly updates.

Run `npm audit` locally to check for known vulnerabilities in dev deps.
