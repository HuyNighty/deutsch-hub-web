# Quality, Security, and Release

## Definition of Done

A feature is done only when all applicable items below are true:

- Acceptance criteria in `05-feature-specifications.md` pass.
- Loading, empty, validation, permission, not-found, and unexpected-error states are implemented.
- Route, API contract, and environment configuration are documented.
- Authorization is enforced by the backend and represented clearly in the UI.
- Automated tests cover the critical behavior at the appropriate layer.
- Keyboard navigation, labels, focus, and contrast have been checked.
- No secret, token, password, personally identifiable data, or internal stack trace is logged or committed.
- The change has a code review and no unresolved contract ambiguity.

## Test strategy

| Layer | Primary purpose | Examples |
| --- | --- | --- |
| Backend domain unit tests | Protect invariants | published course cannot be structurally modified; completed enrollment cannot be dropped. |
| Backend application/API integration tests | Protect authorization and HTTP contract | anonymous learner cannot load enrolled content; duplicate enrollment returns agreed status. |
| Frontend unit/component tests | Protect user-visible behavior | catalog empty state; login validation; completed lesson button disabled. |
| Contract tests | Detect FE/BE drift | OpenAPI or shared examples match response envelopes and error fields. |
| End-to-end tests | Protect the V1 outcome | browse → login → enroll → complete lesson → resume. |

Prioritize a small number of high-value tests over coverage percentage. The current backend snapshot contains no test source; adding the first integration tests is higher value than adding another domain module.

## Security baseline

- Rotate all credentials that were included in configuration and remove them from Git history where applicable.
- Use environment variables or a secret manager for database, JWT, and bootstrap credentials.
- Configure CORS with explicit development and production origins.
- Keep refresh credentials inaccessible to JavaScript in production; use secure cookie controls.
- Validate all mutation input, enforce authorization in application/domain layers, and use rate limits on authentication and destructive actions.
- Return standard error bodies without sensitive details; log a correlation ID server-side.
- Add dependency scanning, secret scanning, and static analysis to CI when the project reaches a shared repository.

## Accessibility and performance baseline

- WCAG 2.2 AA as the default target.
- Semantic HTML, keyboard-first operation, visible focus, descriptive labels, and non-color status signals.
- Avoid shipping all course content in catalog pages; lazy-load routes and use image optimization once media exists.
- Measure Web Vitals on public pages before claiming performance success.
- The learner player may fetch a full small course in V1. If courses become large, introduce a lesson-content read endpoint and cache policy based on measured payloads.

## Environments and release gates

| Environment | Purpose | Minimum controls |
| --- | --- | --- |
| Local | Fast individual development | `.env.example`, local database/container, mockable API. |
| Test/staging | Integrated validation | Isolated data, real auth flow, CORS/config matching production shape. |
| Production | User traffic | Managed secrets, HTTPS, monitoring, backup/restore plan, restrictive CORS. |

Release V1 only after the four core end-to-end flows pass: public course discovery, registration/login, enrollment, and persisted lesson completion/resume.

## Evolution rules for V2 and V3

1. Add a new business area as a bounded context or explicit module, not a collection of unrelated fields in User or Course.
2. Keep read models optimized for UI separate from write-model invariants when the need appears; do not prematurely build a microservice or CQRS platform.
3. Version externally consumed APIs only for a breaking change; additive fields are normally compatible.
4. Keep the modular monolith while the team and deployment are small. Extract a service only when an operational or ownership boundary is proven, not as an architecture exercise.
5. Revisit this documentation at each release, but retain decisions and migration notes rather than rewriting history.

## Final architectural stance

The chosen direction—business-first planning, a modular monolith, DDD-style bounded contexts, Hexagonal boundaries in the backend, feature-oriented frontend modules, and flow-first API design—is correct. The necessary correction is discipline: use these principles to make the next small slice clearer, not to build every future abstraction before a user needs it.
