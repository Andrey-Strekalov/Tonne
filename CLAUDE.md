# Project Overview

`Fermer-front` is the frontend of the "Тонна-СНГ" grain marketplace.  
The app allows authenticated users to view grain buy/sell bids, create new bids

# Tech Stack

- React 19 + TypeScript 5.9
- Vite 8
- React Router 7 (`react-router-dom`)
- TanStack Query 5
- Tailwind CSS 4
- Radix UI primitives + shadcn-style local UI kit
- ESLint 9 + `typescript-eslint` (strict typed rules)

# Business Domain

The product is a B2B/C2B marketplace for grain trade offers:
- users publish buy/sell bids
- users browse market bids
- each bid contains product, price, volume, region, optional quality/comment, and author

Primary bid entity is `TBid` in `src/shared/types/bid.ts`.

# Folder Structure

```text
src/
  app/
    layout/        # Main authenticated layout with nav, footer, "CreateBid" modal trigger
    pages/         # Route-level pages (auth, home, my-bids, about, not-found)
    providers/     # QueryClient + Auth provider/context
    router/        # Route tree + route guards
  shared/
    api/           # HTTP client, auth/bids endpoints, refresh logic
    config/        # Runtime env config
    lib/           # Generic utilities + token storage helpers
    types/         # Domain/API TypeScript types
    ui/
      kit/         # Reusable UI primitives/components
```

Also important:
- `src/index.css` - Tailwind import + theme variables + global styles
- `vite.config.ts` - alias `@ -> src`

# Architecture Rules

- Keep route pages inside `src/app/pages/*`.
- Keep API requests inside `src/shared/api/*`; pages/components should call exported API functions, not raw `fetch`.
- Keep domain and API contracts in `src/shared/types/*`; avoid ad-hoc local interfaces when shared types already exist.
- Keep token operations only in `src/shared/lib/auth.ts` and through auth provider/http layer.
- Reuse UI kit components from `src/shared/ui/kit` before creating custom raw elements.
- Use `@/` alias imports instead of deep relative paths when possible.

# Routing

Routing is defined in `src/app/router/AppRouter.tsx`:

- `/auth` -> `AuthPage` (only for unauthenticated users via `PublicOnlyRoute`)
- `/` -> redirect to `/bids` (inside protected group)
- `/bids` -> `HomePage` (protected)
- `/my-bids` -> `MyBidsPage` (protected)
- `/about` -> `AboutServicePage` (protected)
- `*` -> `NotFoundPage` (public fallback)

Route guards:
- `ProtectedRoute` blocks unauthorized users and redirects to `/auth`
- `PublicOnlyRoute` blocks authorized users and redirects to `/`
- both show loading screen while auth bootstrap is in progress

# Authentication

Auth flow (2-step phone OTP):
1. Request code: `POST /api/v1/auth/request-code/`
2. Confirm code: `POST /api/v1/auth/confirm-code/`
3. Save `access_token` + `refresh_token` to `localStorage`
4. Load current user: `GET /api/v1/auth/me/`

Implementation details:
- Provider: `src/app/providers/AuthProvider.tsx`
- Context/hook: `src/app/providers/auth-context.ts`
- Token storage: `src/shared/lib/auth.ts`
- In dev mode (`import.meta.env.DEV`), OTP code from backend response is shown on auth screen.

Bootstrap behavior:
- On app start, provider checks token presence (`hasTokens`)
- If tokens exist, it calls `getMe`
- On any bootstrap failure, tokens are cleared and session is treated as logged out

# API Layer

Core files:
- `src/shared/api/http.ts` - generic request wrapper
- `src/shared/api/core.ts` - URL builder + response/error parsing
- `src/shared/api/auth-refresh.ts` - refresh endpoint call
- `src/shared/api/auth.ts` - auth endpoints
- `src/shared/api/bids.ts` - bids endpoints

Used backend endpoints:
- `POST /api/v1/auth/request-code/`
- `POST /api/v1/auth/confirm-code/`
- `POST /api/v1/auth/refresh-token/`
- `GET /api/v1/auth/me/`
- `GET /api/v1/bids/`
- `POST /api/v1/bids/`

How API client works:
- `request<T>()` runs `fetch`, parses response body, throws `Error` for non-OK status
- for `auth: true` requests, `Authorization: Bearer <access_token>` is attached
- on `401` (auth requests), client performs a single shared refresh process (`refreshPromise`) and retries once
- if refresh fails, tokens are cleared

# Data Models

Primary models are in `src/shared/types`:

- auth types: `RequestCode*`, `ConfirmCode*`, `RefreshToken*`, `AuthMeResponse`, `TUser`
- bid types: `EBidType`, `TBid`, `TCreateBidRequest`, `TCreateBidResponse`, `TGetBidsResponse`, `TCreateBidForm`

Important shape notes:
- `TBid` currently contains `quality` and `comment` as non-optional strings
- `TCreateBidRequest` uses optional `quality`/`comment`

temporary / TODO:
- `MyBidsPage` uses hardcoded `myBidsDemo` array and is not connected to backend yet
- demo entries have shortened phone values and empty names; treat as mock placeholders only

# Styling

- Tailwind CSS 4 is used globally.
- `src/index.css` defines theme tokens and project colors (`brand`, `page-bg`, `text-main`, etc.).
- Components mostly rely on utility classes + CSS variables.
- `cn()` helper (`src/shared/lib/utils.ts`) merges classes via `clsx` + `tailwind-merge`.

Styling conventions:
- Prefer existing semantic color tokens/classes (`text-text-main`, `bg-page-bg`, etc.)
- Keep responsive behavior with existing breakpoints (`sm`, `xl`) style patterns
- Avoid introducing parallel style systems (CSS modules / styled-components) unless explicitly required

# UI Components

Reusable components live in `src/shared/ui/kit`:
- `Button`, `Card*`, `Input`, `Label`, `Textarea`, `InputOTP*`

Implementation style:
- Radix-based and forwardRef-compatible
- class variants via `class-variance-authority` (`button-variants.ts`)
- re-exported from `src/shared/ui/kit/index.ts` and `src/shared/ui/index.ts`

Rule of thumb:
- If a primitive exists in `ui/kit`, use/extend it instead of duplicating styles in pages.

# Environment Variables

Environment config:
- `VITE_API_BASE_URL` (required)

Location:
- read in `src/shared/config/env.ts`
- exported from `src/shared/config/index.ts`

Behavior:
- missing or empty env variable throws runtime error during app startup

# Development Commands

- `npm install` - install deps
- `npm run dev` - start dev server
- `npm run build` - type-check build + production bundle
- `npm run preview` - preview production build
- `npm run lint` - run ESLint
- `npm run lint:fix` - auto-fix lint issues
- `npm run typecheck` - TS check without emit

# Code Style Rules

Based on current project setup and lint config:

- TypeScript strict mode is enabled; keep types explicit and safe.
- Prefer `type` imports (`@typescript-eslint/consistent-type-imports`).
- No floating promises; wrap async calls in handlers with `void` when intentionally not awaited.
- Use `===`/`!==` and explicit block braces.
- Keep imports via `@/` alias when practical.
- Keep business/user-facing errors as meaningful messages (existing pattern in auth/create bid flow).

# Common Tasks

Add a new page:
1. Create page component in `src/app/pages/...`
2. If page is authenticated, wrap route under protected group in `AppRouter`
3. If page should be navigable from header, add link in `MainLayout`

Add a new API request:
1. Add typed request/response contracts in `src/shared/types`
2. Add endpoint function in `src/shared/api/*` using shared `request<T>()`
3. Re-export from `src/shared/api/index.ts` if needed globally
4. Consume with TanStack Query (`useQuery` / `useMutation`) in page or feature component

Add a new UI component:
1. Place reusable primitive in `src/shared/ui/kit`
2. Follow existing style: `forwardRef`, `cn`, typed props
3. Export via `src/shared/ui/kit/index.ts` (and `src/shared/ui/index.ts` if required)
4. Use Tailwind tokens from `index.css` theme

Work with mock data:
- Current mock area is `MyBidsPage` (`myBidsDemo`)
- clearly mark temporary mocks with `temporary / TODO`
- once backend endpoint exists, replace local constants with API + query hooks

# Do Not Do

- Do not bypass `src/shared/api/http.ts` by adding raw `fetch` directly in pages/components.
- Do not duplicate token logic outside `src/shared/lib/auth.ts` + auth/http flow.
- Do not change route guard semantics without product/security reason.
- Do not break `TBid`/auth contracts without coordinated backend update.
- Do not commit secrets or hardcode environment-specific API URLs in source code.
- Do not rewrite project structure into a different architecture unless explicitly requested.

# Notes for Claude Code

- This project follows a simplified FSD-like separation (`app` vs `shared`); keep that boundary.
- Prefer minimal, incremental changes that align with existing patterns rather than broad refactors.
- Be careful with auth bootstrap and refresh flow; regressions here block the whole app.
- `MyBidsPage` is intentionally temporary mock-driven now; treat migration to API as a targeted task.
- Check `npm run lint` and `npm run typecheck` after non-trivial edits.
