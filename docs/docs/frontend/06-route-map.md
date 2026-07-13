# Route Map

Routes describe frontend navigation. They are intentionally independent of the backend endpoint paths in `10-api-contract-and-backend-alignment.md`.

| Route | Access | Page / layout | Primary data | Notes |
| --- | --- | --- | --- | --- |
| `/` | Public | Marketing shell / Home | Static V1 content; optional featured courses later | Keep focused on the learning loop. |
| `/learn` | Public | Marketing shell / Course catalog | Published-course list | Query: `q`, `page`; validate and normalize both. |
| `/courses/:courseId` | Public | Marketing shell / Course detail | Published-course detail | Use UUID route param; show not-found separately from request failure. |
| `/auth/login` | Public only | Auth layout / Login | None before submit | Query: `returnTo`; allow-list before redirecting. |
| `/auth/register` | Public only | Auth layout / Register | None before submit | Same `returnTo` behavior as login. |
| `/app/learning` | Authenticated | App shell / Learning dashboard | My courses | Canonical learner course list. |
| `/app/learning/:courseId/lessons/:lessonId` | Authenticated | App shell / Course player | My course detail, completed lesson IDs, progress | Validate that selected lesson belongs to loaded course. |
| `/app/settings/profile` | Authenticated | App shell / Profile | Current user | Profile update form. |
| `/app/settings/security` | Authenticated | App shell / Security | Current sessions | Password, session revocation, deactivation. |
| `/admin/courses` | Administrator | Admin shell / Course list | Admin courses | V1.1 only. |
| `/admin/courses/new` | Administrator | Admin shell / Course editor | None | V1.1 only. |
| `/admin/courses/:courseId/edit` | Administrator | Admin shell / Course editor | Admin course detail | V1.1 only. |
| `*` | Any | Not-found page | None | Explain next safe navigation. |

## Route guards

- **Public only** routes redirect an already-authenticated user to an allowed `returnTo` or `/app/learning`.
- **Authenticated** routes wait for session bootstrap before deciding to redirect. Do not flash protected content.
- **Administrator** routes require a role supplied by the authenticated-user contract. Until the API exposes roles in the session/current-user response, do not build an admin browser UI that guesses them.
- Preserve the intended route when redirecting to login, but remove route parameters that include sensitive data.

## Route-level error handling

Each lazy route has a route error boundary. `401`/expired session triggers the auth flow, `403` renders access denied, `404` renders a resource-specific not-found page, and unknown failures render a retryable error panel with a correlation/request identifier when available.

## URL state

Use URL query parameters for shareable catalog state (`q`, `page`). Use local UI state for non-shareable behavior such as an open mobile menu. Do not put access tokens, refresh tokens, full lesson content, or mutable progress in a URL.
