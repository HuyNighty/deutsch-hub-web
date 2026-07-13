# Implementation Plan

## Delivery principle

Deliver vertical slices: a small user outcome works through UI, API, domain rule, persistence, and tests. Do not finish all backend endpoints first and then start all frontend screens; that delays feedback and creates unused abstractions.

## Prerequisite: definition of Ready

A story may enter implementation when it has:

- product outcome and priority;
- persona and task flow reference;
- acceptance criteria including failure states;
- route and wireframe reference;
- agreed API request/response/error examples or a documented reason to use an existing contract;
- authorization owner and source of truth;
- test approach.

## Milestones

### M0 — Safe, reproducible foundation

**Backend:** rotate secrets, environment configuration, CORS, protect current user, normalize error status behavior, create OpenAPI baseline, and add test foundation.  
**Frontend:** Vite + TypeScript setup, formatting/linting, router, query client, environment configuration, HTTP client, error boundary, design tokens, and MSW contract mocks.  
**Proof:** browser can call a protected and a public endpoint in local development without leaking secrets.

### M1 — Public course discovery

**Outcome:** a visitor can browse and evaluate a published course.  
**Frontend:** Home, course catalog, course detail, loading/error/empty/not-found states.  
**Backend contract:** existing `GET /courses` and `GET /courses/{courseId}`; verify pagination, published-only behavior, and preview-only lesson data.  
**Proof:** an end-to-end test opens a published detail and confirms lesson content is not exposed.

### M2 — Authentication and enrollment

**Outcome:** a visitor becomes an enrolled learner without losing course context.  
**Frontend:** login/register, session bootstrap, return-to, enrollment CTA and state.  
**Backend contract:** register, login, refresh, current user, enroll; agreed duplicate-enrollment behavior.  
**Proof:** a test registers/logs in, enrolls once, and then sees a continue action.

### M3 — Learning and progress

**Outcome:** an enrolled learner completes and resumes lessons.  
**Frontend:** dashboard, course player, curriculum navigation, completion mutation, progress.  
**Backend contract:** my courses, enrolled-course detail, completed IDs, completion, progress.  
**Proof:** an end-to-end test completes a lesson, reloads the browser, and sees persisted progress.

### M4 — Account safety and product hardening

**Outcome:** the learner can manage profile and sessions; V1 is usable on real devices.  
**Frontend:** profile, security, responsive/accessibility fixes, analytics only if approved.  
**Backend contract:** profile, password, sessions, logout/revocation, deactivation.  
**Proof:** keyboard and mobile checks pass; destructive actions require confirmation; security integration tests pass.

### M5 — Internal authoring (V1.1)

**Outcome:** an administrator can publish a complete course through the web.  
**Frontend:** isolated admin shell and course editor.  
**Backend contract:** existing admin course endpoints after admin-role and status/error behavior are proven.  
**Proof:** an administrator creates a course, adds a section and lesson, publishes it, and it appears in the public catalog.

## Per-feature workflow

```text
Task flow → feature specification → API examples/OpenAPI → backend use case + tests
         → frontend mock + UI tests → integrated vertical slice → review → release note
```

### Backend implementation order within a slice

1. Confirm domain invariants and authorization policy.
2. Define input/output ports and use case.
3. Add persistence adapter/repository behavior.
4. Expose the HTTP adapter with validation and error mapping.
5. Add unit and integration tests.
6. Update OpenAPI examples.

### Frontend implementation order within a slice

1. Implement page states with mock data/contract handlers.
2. Add typed feature API module and query/mutation hooks.
3. Connect form validation, loading, error, and empty states.
4. Add component and route tests.
5. Integrate with a local backend and test the full flow.

## Lightweight team practices

- One issue/story represents one user outcome and links to these documents.
- Pull requests state the flow, contract change, tests, and screenshots where UI changes.
- Use a short ADR for consequential choices: token transport, course unlock policy, role model, or a new bounded context.
- Code review checks behavior and boundaries first, style second; formatting and linting are automated.
- Keep `target/`, `node_modules/`, IDE folders, local `.env` files, and generated build output out of shared source archives.
