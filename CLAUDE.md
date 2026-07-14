# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

No build tooling, no `package.json`. This is a static single-page app.

- Preview locally: serve the directory directly, e.g. `npx serve .`, and open `index.html`.
- No test suite and no linter are configured in this repo.
- Deployed to Netlify per `netlify.toml`: publish dir is `.`; a `/app` → `/index.html` redirect, plus an SPA catch-all (`/*` → `/index.html`) scoped to `Host = app.flowguard.ng` so deep links and refreshes resolve back into the app without breaking real static assets on other hosts.

## Architecture

This is the **Client Portal** (customer-facing app) for FlowGuard, a drainage-monitoring product. The separate, independently deployed `flowguard-operations` repo is the internal staff dashboard ("Operations Portal"); both talk to the same backend.

- **No framework.** Vanilla JS IIFE modules. `index.html` loads them in a fixed order — `api-client.js` → `auth.js` → `ui.js` → `demo.js` → `screens.js` → `app.js` — each assumes the previous ones already ran.
- **`js/app.js`** (`App` module) is the client-side router. `go(tab, arg)` updates the URL hash for deep-linking (e.g. `#property/PROP-123`), toggles nav active state, and dispatches to `Screens[tab]`. Detail views (`propertyDetail`, `sensorDetail`, `ticketDetail`) take an id argument via dedicated hash patterns; everything else is looked up directly by tab name.
- **`js/screens.js`** (`Screens` module, ~1750 lines) holds one render function per screen. Every screen must handle three states: live data via `apiRequest()`, demo/sample data when `Demo.isOn()`, and an honest empty/awaiting state — never fake a success state when data isn't available.
- **`js/api-client.js`** exposes the single sanctioned entry point for backend calls: `apiRequest(path, options)`. It injects the `Authorization` header from the `localStorage` token, auto-JSON-encodes plain object bodies, and globally redirects to login on any 401 (clearing stored token/user first).
- **`js/ui.js`** is pure render helpers only — toasts, loading skeletons, empty/error states, `esc()` for HTML-escaping. No data fetching happens here; keep it that way.
- **`js/demo.js`** provides the sample dataset and on/off toggle that `Screens` falls back to for users exploring without a live account.
- **Active property scope** is global and persistent: `localStorage['fg_active_property']`. `App.setActiveProperty()` updates it and re-renders the current screen so every screen reflects the same selected property.
- **Backend**: `https://api.flowguard.ng/api/v1`, not in this repo — same backend the Operations Portal uses.
- **`flowguard-operations-center.html` and `operations-center.html` in this repo are legacy prototypes**, not the real Operations Portal — they're older Tailwind-CDN/socket.io experiments predating the current build and are unrelated to the maintained `flowguard-operations` repo. Don't treat them as a reference for current ops UI patterns.
