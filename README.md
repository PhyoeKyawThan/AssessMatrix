# AssessMatrix

React Native client for the Assessment Based Student Performance Analysis API.

- Expo SDK 58, React Native 0.88, React 19.3, TypeScript strict
- Routing: `expo-router` with component-based route files under `src/app`
- Layout: feature-based — routes stay thin, screens and API calls live in `src/features/<domain>`
- Presentation: light/dark/system themes and compact/medium/wide breakpoints from `src/shared/theme`

## Requirements

Node.js 22.13 or newer. This machine's default `node` is v18, so switch first:

```
nvm use 22
```

## Setup

```
cp .env.example .env
npm install
npm start
```

`EXPO_PUBLIC_API_URL` is the Django host. The built-in default is `http://localhost:8000`, except on Android where it is `http://10.0.2.2:8000`. On a physical device, set the LAN address of the machine running the API.

## Architecture

```
src/
  app/                      routes only — each file renders a feature screen
    _layout.tsx             ThemeProvider + AuthProvider + AppStack
    index.tsx               redirect by session status and role
    sign-in.tsx
    admin/{_layout,index}.tsx     RoleGate role="ADMIN"
    teacher/{_layout,index}.tsx   RoleGate role="TEACHER"
    student/{_layout,index}.tsx   RoleGate role="STUDENT"
    +not-found.tsx
  features/
    auth/                   api.ts, auth-context.tsx, role-gate.tsx, sign-in-screen.tsx, routes.ts, types.ts
    dashboard/              role landing screens and per-role copy
  shared/
    api/                    client.ts (Bearer, refresh, error mapping), types.ts (ApiError)
    config/env.ts           API_URL
    storage/token-storage.ts  SecureStore, localStorage on web
    theme/                  layout.ts (breakpoints), palette.ts (light/dark tokens), hydration.ts,
                            theme-context.tsx (ThemeProvider/useTheme), document-style(.web).ts
    ui/                     Screen, Button, Field, ErrorBanner, Badge, SessionLoader,
                            AppStack, ThemeToggle
```

A feature owns its API calls, hooks, screens and types. Routes import through the feature's `index.ts` only. `shared/` never imports from `features/`.

## Theming and responsive layout

`ThemeProvider` in `src/app/_layout.tsx` wraps the whole tree. Every colour comes from `useTheme().colors`, so no component hardcodes a hex value — `src/shared/theme/palette.ts` is the only file that holds colours.

- **Scheme** follows the device or browser setting by default. The `System / Light / Dark` control in `ThemeToggle` overrides it, and the choice persists under `assessmatrix.theme-preference` (AsyncStorage, `localStorage` on web).
- **Web only**: `document-style.web.ts` paints `document.documentElement` with the active background and sets `color-scheme`, so overscroll, narrow-window letterboxing and native form controls match the theme instead of showing white.
- **Status bar** and every navigator surface come from the same palette through `AppStack`.

Sizing comes from `useResponsive()`, which maps the window width in `src/shared/theme/layout.ts`:

| Breakpoint | Width | Applies to | Content width | Form width | Detail columns | Type scale |
| --- | --- | --- | --- | --- | --- | --- |
| `compact` | `< 700` | phones, portrait and landscape | full | full | 1 | 1.0 |
| `medium` | `700–1023` | tablets | 720 | 560 | 2 | 1.05 |
| `wide` | `≥ 1024` | desktop browsers, large tablet landscape | 960 | 560 | 2 | 1.1 |

`Screen` applies the gutter, column gap and max width; `Button` and `Field` raise their touch target to 52dp off phones; sign-in and the role homes wrap their fields in a surface card once the viewport is not compact. Font sizes go through `scale()` so they grow with the breakpoint while still honouring the platform's accessibility font scaling. `app.json` sets `orientation: "default"` and `ios.supportsTablet` so landscape and tablet layouts are actually reachable.

**Server rendering.** `web.output: "server"` in `app.json` means the first HTML is rendered where neither `localStorage` nor a viewport exists, so it always comes out light and compact. `useHydrated()` in `src/shared/theme/hydration.ts` holds the client to that same output for its first pass and applies the stored theme and real breakpoint in the commit right after — without it React logs a hydration mismatch on every themed screen. The cost is one frame of light/compact markup on web; native starts already hydrated.

## Authentication

This app is a mobile client per `docs/api-conventions.md`, so it uses the JSON token path rather than cookies:

| Call | Contract |
| --- | --- |
| `POST /api/token/` with `Client-Type: mobile` | `{"email", "password"}` → `{"access", "refresh"}`. The token pair is stored, never the password. |
| Protected requests | `Authorization: Bearer <access>` |
| `401` on any request | one `POST /api/token/refresh/`, then the request retries with the new access token. Concurrent 401s share one refresh because refresh rotation blacklists the old token. |
| `POST /api/token/logout/` | blacklists the refresh token, then local tokens are cleared |
| `GET /api/me/` | the profile that decides which route group you land on |

Login uses **email**, not username. The role comes from the account, so the sign-in form does not ask for one — after `GET /api/me/` returns, `HOME_BY_ROLE` routes `ADMIN` to `/admin`, `TEACHER` to `/teacher`, `STUDENT` to `/student`. Each role layout wraps its stack in `RoleGate`, so typing `/admin` while signed in as a student bounces to `/student`, and a signed-out caller goes to `/sign-in`.

Error bodies are parsed both ways: SimpleJWT returns `{"detail": ...}` on the token endpoints, the rest of the API returns `{"code", "detail", "fields"}`, and `fields` renders under the message.

## Current state

Implemented: sign-in, session restore, refresh, logout and role routing, plus role landing screens that call `GET /api/me/` to prove the session — all of it themed for light and dark and laid out for phones, tablets and desktop browsers.

Not built yet: the milestone 1 and 2 screens (users admin, academics, semesters, modules, enrollments). The API already serves them at `/api/users/`, `/api/academics/`, `/api/semesters/`, `/api/modules/` and `/api/enrollments/`.

`npm run web` signs in for real: the API sends CORS headers for the browser origins listed in `CORS_ALLOWED_ORIGINS` (see `docs/api-conventions.md` in the API repo), which defaults to the Expo web dev ports `8081`, `19000` and `19006`. Two things to keep aligned — the origin the browser reports must be in that list, and `EXPO_PUBLIC_API_URL` must be reachable *from the browser*, so `http://localhost:8000` works only when the API also binds the host you use. If the preflight answers without `client-type` in `Access-Control-Allow-Headers`, the browser blocks the request and the form reports `TypeError: NetworkError`.
