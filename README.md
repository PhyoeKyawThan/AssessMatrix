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
    _layout.tsx             ThemeProvider + AuthProvider + PushNotifications + AppStack
    index.tsx               redirect by session status and role
    sign-in.tsx
    admin/{_layout,index}.tsx     RoleGate + AppShell role="ADMIN"
    teacher/{_layout,index}.tsx   RoleGate + AppShell role="TEACHER"
    student/{_layout,index}.tsx   RoleGate + AppShell role="STUDENT"
    +not-found.tsx
  features/
    auth/                   api.ts, auth-context.tsx, role-gate.tsx, sign-in-screen.tsx, routes.ts, types.ts
    dashboard/              api.ts, types.ts (the /api/dashboard/ payload), copy.ts,
                            screens/{admin,teacher,student}-dashboard-screen.tsx,
                            components/{dashboard-frame,list-panel}.tsx
    shell/                  nav.ts (one item list per role), components/{app-shell,app-header}.tsx
    notifications/          api.ts (POST/DELETE /api/me/push-token/),
                            push-notifications.tsx (PushNotifications provider)
  shared/
    api/                    client.ts (Bearer, refresh, error mapping), types.ts (ApiError),
                            use-resource.ts (useResource/useSubmit, Page)
    config/env.ts           API_URL
    storage/token-storage.ts  SecureStore, localStorage on web
    theme/                  layout.ts (breakpoints), palette.ts (light/dark tokens + tones),
                            hydration.ts, theme-context.tsx (ThemeProvider/useTheme), document-style(.web).ts
    ui/                     Screen, Button, Field, ErrorBanner, Badge, SessionLoader, Sheet,
                            AppStack, ThemeToggle, Icon, StatTile, DonutChart, BarChart
```

A feature owns its API calls, hooks, screens and types. Routes import through the feature's `index.ts` only. `shared/` never imports from `features/`.

## Theming and responsive layout

`ThemeProvider` in `src/app/_layout.tsx` wraps the whole tree. Every colour comes from `useTheme().colors`, so no component hardcodes a hex value — `src/shared/theme/palette.ts` is the only file that holds colours. Both schemes are derived from the university crest: shield blues for `brand`/`primary`, the banner yellow for `accent` (active tab marker, avatar), wreath green and ink for the `success`/`neutral` chart series.

Semantic `tones` (`primary`, `accent`, `success`, `warning`, `danger`, `neutral`) drive stat tiles, badges and chart series. The API sends a tone name, never a colour, and `toneSet()` falls back to `neutral` for anything it does not recognise.

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

## Navigation shell

`AppShell` in `src/features/shell/components/app-shell.tsx` wraps every role group and renders the same `NAV_BY_ROLE` list three ways: a 236dp sidebar with the crest and the signed-in account on `wide`, a 76dp icon rail on `medium`, and a bottom tab bar on `compact`. The tab bar shows four sections plus **Account**; a role with more sections swaps the fourth for a **More** sheet, so sign-out is reachable at every width. Selection is a pathname prefix match, so a detail screen keeps its section highlighted.

`AppHeader` stays inside the screen column — it carries the page title, the screen's own actions and the theme toggle, and no longer repeats the navigation.

## Dashboards

Each role home reads one endpoint, `GET /api/dashboard/`, which returns `stats[]`, a `donut`, `bars` and role-specific lists (`recent_modules` / `recent_enrollments` for admin, `upcoming_assessments` / `recent_marks` for teacher and student). `DashboardFrame` renders the shared part — tiles, donut and bars — so the three screens differ only in the lists underneath. Charts are `react-native-svg` (donut) and plain views (bars), so the same components run in the APK and in the browser.

## Push notifications

`PushNotifications` in `src/features/notifications/push-notifications.tsx` wraps the navigator in `src/app/_layout.tsx`. While a session exists it asks for the notification permission, creates the `assessmatrix-updates` Android channel, gets the Expo push token for the EAS project in `app.json`, and stores it with `POST /api/me/push-token/`. The app still works if that fails — it is just quiet — so every early return logs `[push] <reason>` through `report()` instead of swallowing the error. A missing EAS project id, a refused permission and a rejected token are three different problems, and each names itself in the console.

Unregistering is `signOut`'s job, not the provider's: it sends `DELETE /api/me/push-token/` before `clearTokens()`, because that is the last moment the request still has an access token to authenticate with.

Two backend events reach a student: a mark written for them, and an assessment that moves to `OPEN`. The payload carries `{"type": "mark" | "assessment"}`, and the tap handler routes `mark` to `/student/results` and `assessment` to `/student`. `setNotificationHandler` shows the banner and the notification-list entry while the app is in the foreground.

Android is the real target, and `expo-notifications` needs Firebase there: its native code talks to `FirebaseMessaging.getInstance()`, which only initialises when the app is built with a `google-services.json`. Set it up once:

1. In the Firebase console create a project, add an Android app with package `ucsh.assessmatrix.mm`, and download `google-services.json`.
2. Put the file at the repo root. `android.googleServicesFile` in `app.json` already points at `./google-services.json`, and prebuild's default Android plugins apply the Google Services Gradle plugin automatically — no extra npm package and no `android/` edits.
3. Build it: `eas build --profile development --platform android`, then install that APK on the device. Expo Go cannot register push tokens from SDK 53 onward, and a web session never can; `IS_PUSH_CAPABLE` is false there because browser push needs a service worker and VAPID keys. `npx expo run:android` works too and only needs the file on disk, whereas a cloud build uploads just the files your ignore rules allow — and `.gitignore` currently lists `google-services.json`, so either commit it (its values are client-side config, not credentials) or pass it to EAS as a file variable, the type the EAS docs use `google-services.json` as the example for.
4. Sign in and confirm `POST /api/me/push-token/` appears in the server log, or that `users_user.push_token` is non-empty for that account.

`extra.eas.projectId` in `app.json` and push credentials on the Expo project are also required — `eas credentials` shows both. The `expo-notifications` plugin entry carries the Android notification icon, the `#0B6FA8` tint and the default channel id, so those land only after `npx expo prebuild` or an EAS build. The backend sends through `core/notifications.py`, which needs `EXPO_ACCESS_TOKEN`; without it a delivery is logged as skipped rather than attempted.

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

Implemented: sign-in, session restore, refresh, logout and role routing, the `AppShell` navigation, a dashboard per role from `/api/dashboard/`, Expo push registration for the two mark and assessment events, plus every screen the API currently serves — milestone 1/2 (users, academic years, semesters, modules, enrollments with single and bulk add) and milestone 3/4 (an admin offers a module of the current academic year to one named teacher, which creates that module's plan in `DRAFT`; the teacher then adds assessment types and the raw max marks of each assessment, publish/revert, the assessment state buttons, the marking roster and mark correction). There is no percentage weighting anywhere: a module is scored out of the sum of its assessment marks, and the modules list names the teacher each module was offered to. All of it is themed for light and dark and laid out for phones, tablets and desktop browsers.

Verification uses `npm run web` against the API on `:8000`. Every route is screenshotted in headless Chrome at 390×1500, 820×1500 and 1440×1400 in both themes — 19 routes × 3 widths × 2 themes — and each run asserts the breakpoint the app itself resolved, that nothing overflows the viewport, and that the console stayed clean. `LayoutPreviewBar` (dev builds only) forces a breakpoint on one screen when you need to compare them side by side.

`npm run web` signs in for real: the API sends CORS headers for the browser origins listed in `CORS_ALLOWED_ORIGINS` (see `docs/api-conventions.md` in the API repo), which defaults to the Expo web dev ports `8081`, `19000` and `19006`. Two things to keep aligned — the origin the browser reports must be in that list, and `EXPO_PUBLIC_API_URL` must be reachable *from the browser*, so `http://localhost:8000` works only when the API also binds the host you use. If the preflight answers without `client-type` in `Access-Control-Allow-Headers`, the browser blocks the request and the form reports `TypeError: NetworkError`.
