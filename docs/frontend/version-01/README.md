# DeutschHub Frontend Planning

This folder is the implementation contract for the DeutschHub web application. It turns product intent into a sequence of user-facing capabilities, routes, API contracts, and delivery work. It is deliberately written before implementation so that coding is execution, not discovery.

## How to use this documentation

Read the documents in numeric order. A feature is ready to implement only when its relevant user flow, feature specification, route, API contract, and acceptance criteria are complete.

| Document | Owns | Does not own |
| --- | --- | --- |
| `00-product-scope.md` | V1 outcome, priority, and non-goals | Screen details or API shapes |
| `01-personas.md` | Who the product serves and why | Navigation or implementation |
| `02-user-journeys.md` | Long-term user outcomes | Click-by-click interactions |
| `03-information-architecture.md` | Areas, pages, and ownership | URL syntax or API endpoints |
| `04-task-flows.md` | User actions, rules, success and failure paths | Visual design |
| `05-feature-specifications.md` | Scope and acceptance criteria | Component implementation |
| `06-route-map.md` | Web URLs, access, page loaders | Backend URL design |
| `07-wireframes.md` | Page hierarchy, content and interaction zones | Final visual tokens |
| `08-design-system.md` | Reusable visual and accessibility rules | Business rules |
| `09-frontend-architecture.md` | Code boundaries and state management | Backend domain internals |
| `10-api-contract-and-backend-alignment.md` | API contract, gap analysis, and API backlog | UI layout |
| `11-implementation-plan.md` | Vertical slices, sequencing, and ways of working | Detailed requirements |
| `12-quality-security-and-release.md` | Definition of Done and release gates | Product prioritisation |

## Working rules

1. Use one canonical product term everywhere: **Course**, **Enrollment**, **Lesson**, **Learning dashboard**, and **Article**. The V1 web app does not use the competing product-area names `Stories` and `Experiences`.
2. A user journey explains a life goal; a task flow explains one product task. Do not duplicate either in feature or wireframe documents.
3. A route is a frontend URL; an endpoint is a backend URL. They are related but never need to match.
4. The UI may only infer a business rule when the rule is explicitly documented. Authorization, completion, eligibility, and publication rules remain backend-owned.
5. Every feature documents loading, empty, validation, permission, and unexpected-error states before code starts.
6. Change a documented decision through a short Architecture/Decision Record (ADR) in the pull request or issue that changes it. Do not silently change a contract in code.

## Release terminology

- **V1 / MVP:** a learner can discover a published course, create a session, enroll in a free course, study lessons, and see progress.
- **V1.1:** operational authoring/admin screens and hardening of the same learning loop.
- **V2+:** assessment, certificates, editorial knowledge content, study-in-Germany journeys, and other capabilities described as future work.

This scope is intentionally narrower than the long-term DeutschHub vision. A coherent learning loop provides a stable base for later modules; it is not a reduced-quality product.
