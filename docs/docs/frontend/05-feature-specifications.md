# Feature Specifications

This file converts the approved V1 task flows into implementable requirements. A feature is complete only when its acceptance criteria and documented error states are met.

| ID   | Feature                               | Priority | Persona       | Acceptance criteria                                                                                                                                |
| ---- | ------------------------------------- | -------- | ------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| F-01 | Session bootstrap                     | P0       | Learner       | On app start, restore a valid session once; on failure, present anonymous state without an error loop.                                             |
| F-02 | Registration and login                | P0       | Visitor       | A visitor can register or log in; validation and invalid credentials are understandable; an allowed `returnTo` route is respected.                 |
| F-03 | Course catalog                        | P0       | Visitor       | Show only published courses; search, pagination, loading, no-result, and error states work.                                                        |
| F-04 | Public course detail                  | P0       | Visitor       | Show course metadata and preview curriculum; never render protected lesson content.                                                                |
| F-05 | Course enrollment                     | P0       | Learner       | Enroll once in a free published course; duplicate enrollment becomes a continue-learning action.                                                   |
| F-06 | Learning dashboard                    | P0       | Learner       | List active and completed courses; each active course has one clear continue action; empty state guides the learner to the catalog.                |
| F-07 | Course player                         | P0       | Learner       | Render full enrolled course content, section navigation, selected lesson, and completion state; deny access safely when enrollment is unavailable. |
| F-08 | Lesson completion and progress        | P0       | Learner       | A lesson completion updates server-backed progress and the UI; repeat clicks and stale state do not create confusing results.                      |
| F-09 | Profile                               | P1       | Learner       | View and update name and phone number with server validation; update displayed session data after success.                                         |
| F-10 | Session/security settings             | P1       | Learner       | List sessions, revoke a session or all sessions with confirmation, and change password with clear outcomes.                                        |
| F-11 | Course administration                 | P1       | Administrator | Create a draft, manage sections/lessons, publish only when backend allows it, and show API validation errors.                                      |
| F-12 | Accessibility and responsive baseline | P0       | All           | Every P0 feature works by keyboard, has visible focus, readable feedback, and layouts from 320px upward.                                           |

## Cross-feature requirements

### Loading and data freshness

- Display a meaningful skeleton or pending indicator for page data.
- Mutations disable the submitted control and announce progress to assistive technology where appropriate.
- After enrollment, completion, profile update, or session mutation, invalidate only affected server-state queries.
- Never copy server data into a global client store merely to avoid a refetch.

### Errors

- Map API validation errors to the relevant form fields when `errors[].field` is supplied.
- Map authorization failure to sign-in or an access-denied page according to the current session.
- Map not-found resources to a route-level not-found state.
- Preserve non-sensitive user input after a recoverable failure; never preserve passwords.

### Analytics events (optional until analytics is adopted)

Use names that describe user behavior, not implementation: `course_catalog_viewed`, `course_detail_viewed`, `enrollment_succeeded`, `lesson_completed`, and `learning_resumed`. Do not send lesson content, passwords, tokens, or personal data.

## V2 feature entry rule

A V2 feature may be planned only after it has a product outcome, persona, task flow, owner context, API contract, acceptance criteria, and a decision about its V1 interaction. Domain aggregates alone are not a release commitment.
