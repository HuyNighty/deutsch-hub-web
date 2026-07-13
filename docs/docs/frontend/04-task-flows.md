# Task Flows

Task flows specify one user goal, its business rules, and all expected outcomes. They are the starting point for API design: each state transition that needs server-owned data or authority reveals an API contract.

## Flow LF-01 — Discover and evaluate a course

**Actor:** curious visitor or learner  
**Goal:** decide whether a published course is suitable.  
**Precondition:** none.

```text
Open Learn → Browse/search catalog → Open course detail → Inspect curriculum preview
```

| Step | UI behavior | Server responsibility |
| --- | --- | --- |
| Load catalog | Show course cards and filters. | Return only published, non-deleted courses with pagination. |
| Search | Debounce text input; reset to first page. | Match a `keyword` safely and return stable paging metadata. |
| Open detail | Display title, description, CEFR level, price, duration, sections and lesson previews. | Do not expose full lesson content to anonymous visitors. |
| Choose enroll | If anonymous, preserve course ID and redirect to sign-in/register. | None until enrollment. |

**Alternatives:** no result, course removed/unpublished after listing, invalid page, temporary request failure.  
**Done when:** the visitor can make an informed enrollment decision without an account.

## Flow LF-02 — Register or sign in, then return

**Actor:** anonymous visitor  
**Goal:** establish a session without losing the intended action.  
**Precondition:** visitor is on an authentication page or has chosen a protected action.

```text
Choose protected action → Save returnTo → Register or sign in → Session established → GET current user → returnTo or dashboard
```

| Rule | Expected behavior |
| --- | --- |
| Return target | Accept only internal, allow-listed routes; never redirect to an arbitrary external URL. |
| Validation | Show field-level validation before submission where possible and backend validation after submission. |
| Session bootstrap | The app must call the current-user endpoint or use the login response to hydrate session state. |
| Token expiry | Attempt one refresh; if it fails, clear local session state and go to sign-in. |
| Duplicate submission | Disable the submit action while the request is pending. |

**Failure paths:** existing username/email, invalid credentials, invalid/expired refresh token, network failure. Email verification is not part of V1 and must not appear in the flow.

## Flow LF-03 — Enroll in a course

**Actor:** authenticated learner  
**Goal:** obtain access to a free, published course.  
**Precondition:** the learner is on a published course detail page.

```text
Choose Enroll → POST enrollment → Enrollment created → Refresh learner data → Go to course player or dashboard
```

| Business rule | UI consequence |
| --- | --- |
| Only an authenticated user may enroll. | Redirect anonymous users through LF-02. |
| Only published courses are enrollable. | Hide or disable the action if the detail cannot be loaded; handle a server rejection gracefully. |
| A learner enrolls once per course. | If the API reports existing enrollment, show “Continue learning” rather than an error. |
| V1 has no payment. | Never show a checkout path even though a course contains price data. |

**Failure paths:** course no longer exists, course unpublished, duplicate enrollment, expired session, request failure.  
**Done when:** the learner has an active enrollment and can see the course in the learning dashboard.

## Flow LF-04 — Study and complete a lesson

**Actor:** enrolled learner  
**Goal:** consume course content and record completion.  
**Precondition:** active enrollment in the requested course.

```text
Open course player → Load course + completion data → Select lesson → Read lesson → Mark complete → Refresh progress → Select next lesson
```

| Step | UI behavior | Server-owned rule |
| --- | --- | --- |
| Load player | Request enrolled course detail and completed lesson IDs in parallel. | Return full lesson content only to an active enrollment. |
| Select lesson | Render the selected lesson in stable course/section order. | V1 allows all active lessons after enrollment. |
| Mark complete | Send a single mutation with non-negative study minutes; show pending state. | A lesson can be completed once; server recalculates enrollment progress. |
| Update | Invalidate/refetch progress and completed IDs; update dashboard cache. | Completion percentage and enrollment status are authoritative server values. |
| Continue | Select the first incomplete lesson after the current one, or show course completion. | There is no V1 sequential-lock rule. |

**Failure paths:** missing/expired enrollment, lesson not in course, already-completed mutation caused by a stale tab, course changed, request failure.  
**Important:** the current backend returns an error for a duplicate completion. The UI must disable completion for known completed lessons; a future backend improvement may make the operation idempotent.

## Flow LF-05 — Resume learning

**Actor:** returning learner  
**Goal:** reach the next action quickly.  
**Precondition:** authenticated session.

```text
Open learning dashboard → Load my courses → Choose active course → Load player → Continue at first incomplete lesson
```

The dashboard may derive the next lesson from course detail plus completed IDs in V1. When this becomes costly or personalized, add a backend-owned `learning-dashboard`/`next-lesson` read model rather than duplicating recommendation rules in the browser.

## Flow LF-06 — Manage profile and sessions

**Actor:** authenticated learner  
**Goal:** update personal information or end a session safely.

```text
Open Settings → View/edit profile or sessions → Confirm mutation → Refresh displayed data
```

Destructive actions (deactivate account, log out a device, log out all devices) require explicit confirmation and clear post-action behavior. Password changes require the current password and a confirmation field.

## Flow AF-01 — Admin course authoring (V1.1)

**Actor:** administrator  
**Goal:** create a publishable course.  
**Precondition:** the actor has the current `ADMIN` role.

```text
Create draft course → Add section → Add lesson → Review → Publish → Verify public detail
```

The backend owns ownership and publication rules. The UI must not claim an `INSTRUCTOR` role until that role and its authorization policy exist in the backend.

## API-discovery method

For every new task, ask four questions before writing an endpoint:

1. What user outcome or state transition is needed?
2. Is the data public, user-specific, or role-restricted?
3. Which bounded context owns the rule and its source of truth?
4. Can an existing contract satisfy it without making the frontend infer a business rule?

If a rule is user-specific or must be secure, it belongs in an application use case and API—not in React state.
