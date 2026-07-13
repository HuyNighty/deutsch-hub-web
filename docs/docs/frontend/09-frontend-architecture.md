# Frontend Architecture

## Architectural goal

Build a modular React application where business features can evolve independently, API changes remain local, and application logic is testable without a browser. This is a **modular frontend**, not a frontend copy of backend Hexagonal Architecture.

## Recommended stack

- React + Vite + **TypeScript** with strict compiler settings.
- React Router for route composition, loaders/route guards where useful, and route-level error boundaries.
- TanStack Query for server state, request caching, invalidation, and mutation status.
- Tailwind CSS plus a small token layer; optionally shadcn/ui as an owned component base.
- Zod for forms and runtime validation at API boundaries where it provides value.
- React Hook Form for non-trivial forms.
- MSW for UI development against agreed API contracts; Vitest and Testing Library for automated tests.

Do not add Redux or a global state library by default. Server data belongs in TanStack Query; small UI state belongs close to the component; a session store should contain only minimal authenticated-user state.

## Folder structure

```text
src/
├── app/                         # providers, router, app bootstrap, global styles
├── pages/                       # route composition only; no business data fetching rules
├── features/
│   ├── auth/
│   │   ├── api/                 # endpoint calls and contract adapters
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── schemas/
│   │   ├── types/
│   │   └── views/
│   ├── courses/                 # public catalog and detail
│   ├── learning/                # dashboard, player, completion/progress
│   ├── profile/
│   └── admin-courses/           # V1.1; isolated from learner feature
├── shared/
│   ├── api/                     # HTTP client, ApiResponse parsing, query client
│   ├── components/              # reusable UI primitives and layout
│   ├── config/                  # environment parsing and constants
│   ├── lib/                     # framework-agnostic helpers
│   └── types/                   # genuinely cross-feature types only
├── assets/
└── test/                        # test setup and MSW handlers
```

## Dependency rules

1. `app` and `pages` may compose features; a feature never imports another feature's private internals.
2. A feature may import `shared`; `shared` never imports a feature.
3. React components do not call `fetch` directly. They use a feature query/mutation hook, which calls that feature's API module.
4. Components receive UI-ready models. Translate backend response DTOs at the API boundary when the frontend needs different naming or grouping.
5. Backend authorization is authoritative. Route guards improve user experience but never replace API enforcement.

## Server-state pattern

```text
Route/page → feature view → query or mutation hook → feature API module → shared HTTP client → backend
```

Use stable query keys such as `['courses', filters]`, `['course', courseId]`, `['my-courses']`, `['my-course', courseId]`, and `['course-progress', courseId]`. After lesson completion, invalidate the affected course, progress, completed-lessons, and dashboard queries—rather than mutating unrelated cached objects by hand.

## Authentication boundary

The current backend returns access and refresh tokens in JSON. For a public production deployment, revise this contract so the refresh token is a `Secure`, `HttpOnly`, appropriate-`SameSite` cookie; keep the short-lived access token only in memory. Do not store refresh tokens in `localStorage`.

Until the backend contract is changed, treat the token design as development-only and isolate it in `features/auth/api` and the shared HTTP client. The rest of the UI must never know token storage details.

## Error contract boundary

The HTTP client parses the shared `ApiResponse<T>` envelope once, normalizes transport failures, and exposes typed application errors. Features handle only user-facing decisions: field validation, not-found, access-denied, retry, or generic failure.

## Backend context mapping

| Frontend feature | Backend bounded context | Backend source of truth |
| --- | --- | --- |
| Auth and settings | Identity | User, session, roles |
| Catalog | Learning | Published Course |
| Enrollment/player/progress | Learning | Enrollment, LessonCompletion, Course |
| Future articles | Content | Article, Category |

This mapping protects the frontend from building a fake `Account` mega-feature that owns unrelated business data.

## Testing boundary

- Unit test pure mappers, schemas, and business display helpers.
- Component test user-visible behavior with MSW, not implementation details.
- Add end-to-end tests for register/login, enrollment, lesson completion, and expired-session recovery once local environments are reproducible.
- Keep API contract examples or OpenAPI-generated types under version control; mocks must fail when their contract drifts.
