# API Contract and Backend Alignment

## Purpose

The frontend is a consumer of business capabilities, not a caller of arbitrary CRUD endpoints. This document records the backend snapshot reviewed for this plan, the V1 contract, and the order in which missing API work should be discovered.

**Reviewed snapshot:** `deustch-hub (2).zip` supplied on 2026-07-13.  
**Configured local base URL:** `http://localhost:8080/deutsch-hub/api/v1` because Spring uses context path `/deutsch-hub`. The frontend reads this from `VITE_API_BASE_URL`; it never hard-codes it in components.

## Current backend capability

The backend has real `Identity` and `Learning` application layers, ports, domain models, persistence adapters, controllers, JWT security, and an `ApiResponse<T>` envelope. The `Content` context currently has domain model classes only; it has no application use cases or HTTP API. This aligns well with the narrowed V1 learning loop.

### Existing learner-facing endpoints

| Capability | Current endpoint | V1 use |
| --- | --- | --- |
| Register | `POST /auth/register` | F-02 |
| Login | `POST /auth/login` | F-01/F-02 |
| Refresh | `POST /auth/refresh` | F-01 |
| Logout | `POST /auth/logout` | F-01/F-10 |
| Current user | `GET /auth/me` | F-01/F-09 |
| Update profile | `PATCH /users/me/profile` | F-09 |
| Change password | `PUT /users/me/password` | F-10 |
| List/revoke sessions | `GET /users/me/sessions`, `DELETE /users/me/sessions/{sessionId}` | F-10 |
| Revoke all sessions | `POST /users/me/logout-all` | F-10 |
| Deactivate account | `PATCH /users/me/deactivate` | F-10 |
| Catalog | `GET /courses?keyword=&page=&size=` | F-03 |
| Public course detail | `GET /courses/{courseId}` | F-04 |
| Enroll | `POST /courses/{courseId}/enroll` | F-05 |
| My courses | `GET /me/courses` | F-06 |
| My enrolled course detail | `GET /me/courses/{courseId}` | F-07 |
| Complete a lesson | `POST /me/courses/{courseId}/lessons/{lessonId}/complete` | F-08 |
| Course progress | `GET /me/courses/{courseId}/progress` | F-06/F-08 |
| Completed lesson IDs | `GET /me/courses/{courseId}/completed-lessons` | F-07/F-08 |
| Drop course | `POST /me/courses/{courseId}/drop` | F-06 |

The current public detail returns lesson-preview data without lesson content. The enrolled-course detail returns full lesson content. This is a sound V1 public/private read boundary.

### Existing administrator endpoints

`/admin/courses` supports course creation, detail, update/delete, section/lesson CRUD, publish/unpublish, and enrollment review. `/admin/users` supports user administration. These are sufficient for a later internal web console, subject to the authorization fixes below.

## Required response contract

Retain one predictable response envelope for successful JSON responses:

```json
{
  "code": 200,
  "message": "optional human-readable message",
  "result": {}
}
```

For validation failures, include field errors without returning secret values:

```json
{
  "code": 400,
  "message": "Validation failed",
  "errors": [{ "field": "email", "message": "must be a valid email" }]
}
```

The HTTP status must communicate the failure class. The frontend must not infer it from an English message.

| Situation | Required HTTP status |
| --- | --- |
| Invalid input | 400 or 422, choose one convention |
| Unauthenticated / expired access token | 401 |
| Authenticated but forbidden | 403 |
| Resource not found or not visible | 404 |
| Duplicate enrollment or invalid state transition | 409 |
| Unexpected server failure | 500 |

The current global exception handler maps all `BusinessException` values to 400. Correct this before treating API errors as a stable frontend contract.

## Critical alignment decisions and fixes

| Priority | Observation from backend snapshot | Required decision / fix |
| --- | --- | --- |
| P0 | `SecurityConfig` permits `/api/v1/auth/**`, but `GET /auth/me` dereferences a JWT. Anonymous requests can reach it without a principal. | Protect `/auth/me`, or move it to `/users/me`, and add an integration test for 401. |
| P0 | No CORS configuration is visible. A Vite app on another origin will be blocked by browsers. | Add an environment-specific CORS policy for approved frontend origins; do not use unrestricted production origins. |
| P0 | Database credentials, JWT secret, and bootstrap admin credentials are present in `application.yaml`. | Rotate exposed values immediately; remove secrets from source control; load them from environment/secret management. |
| P0 | There are no test sources in the snapshot. | Add unit tests for domain invariants and integration tests for auth, public-course access, enrollment, and completion before expanding domains. |
| P0 | Only `USER` and `ADMIN` roles exist. All authoring controllers are `ADMIN`-only, while the domain calls the owner field `instructorId` and the security note describes `INSTRUCTOR`. | V1 decision: authoring is admin-only. Do not expose instructor UX or documentation. Before V2 instructor support, add a real role, policies, role claims, and tests. |
| P1 | Login/current-user responses do not expose roles. | Add the necessary non-sensitive role/permission information before building an admin route guard. API enforcement remains mandatory. |
| P1 | Domain `Course` contains an unused import from the application DTO package. | Remove it; domain code must not depend on application request DTOs. This is a small but real Clean Architecture boundary violation. |
| P1 | Request records shown for register/login have no field validation annotations. | Define explicit constraints and test them; `@Valid` alone has no effect without constraints. |
| P1 | The response uses `instructorId` in public course data. | Do not expose it unless the product has a public instructor concept; prefer a deliberate public author profile later. |
| P2 | `Quiz`, `Certificate`, `Article`, and `Category` models exist but no completed application/API slice supports the proposed old frontend scope. | Keep them out of V1 UI. Introduce each only from an approved flow and contract. |

## Authentication contract recommendation

For a browser application, use a short-lived access token in memory and a refresh token in a `Secure`, `HttpOnly`, appropriately `SameSite` cookie. The refresh endpoint reads the cookie; logout revokes it and clears the cookie. This avoids persistent JavaScript access to the refresh token.

The current JSON refresh-token response can support local learning experiments, but should not be treated as a production-ready browser security design. The frontend isolates this temporary implementation behind its auth API adapter.

## API backlog: how to know the next API

Do not create endpoints simply because an aggregate exists. Start with an approved task flow and add an API only when the current contract cannot satisfy a server-owned rule.

### Work now — stabilize, not expand

1. Rotate secrets and add environment configuration.
2. Protect current-user access and configure CORS.
3. Make error status mapping consistent and write integration tests.
4. Publish an OpenAPI specification for the existing Identity and Learning endpoints; use it as the cross-team API contract.
5. Build the V1 learner frontend against the existing catalog, enrollment, learning, and progress endpoints.

### First optional read-model API, only after UI evidence

If the dashboard needs several dependent requests or starts duplicating “next lesson” logic, add:

```text
GET /me/learning-dashboard
```

It returns active/completed course summaries and a server-chosen `continueLessonId` when a policy exists. Do not add it before profiling the existing `GET /me/courses` experience; it is an optimization/read model, not a prerequisite.

### V2 APIs are derived from their future flows

| Future flow | Owning context | API work implied |
| --- | --- | --- |
| Take an assessment | Learning / Assessment | List available assessment, start attempt, save/submit answers, result, eligibility. |
| Receive a certificate | Learning | Read own certificates, read/download one certificate; issuance policy remains server-side. |
| Read editorial content | Content | Public article list/filter/detail, categories, pagination; admin authoring separately. |
| Manage study preparation | Study Journey | Journey template, personal plan, checklist state; never place this inside Identity by default. |

## Contract workflow used by real teams

1. Product/UX writes the task flow and acceptance criteria.
2. Frontend and backend agree on examples, authorization, error cases, and pagination in OpenAPI before implementation.
3. Frontend builds with contract mocks; backend implements a use case and integration tests.
4. Both sides run contract/integration checks against a local environment.
5. A completed feature updates the changelog/ADR and its API examples.

This replaces the question “what API should I add next?” with “what contract is required by the next approved user outcome?”
