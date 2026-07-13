# Product Scope and MVP Decision

## Product outcome

DeutschHub helps Vietnamese people make sustained progress towards a Germany-related goal. The first release proves one complete loop: a learner finds a suitable German course, enrolls, studies, and sees their progress.

The product is not yet a complete encyclopedia about Germany, a study-abroad service, a social network, or a marketplace.

## V1 product promise

> A registered learner can independently start and continue a free German course on the web.

### V1 capabilities

| Capability              | Included outcome                                                                                                                          |
| ----------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| Public course discovery | Browse, search, and open published courses without signing in.                                                                            |
| Identity                | Register, sign in, restore a session, sign out, and view/update a profile.                                                                |
| Enrollment              | An authenticated learner enrolls once in a free published course.                                                                         |
| Learning                | An enrolled learner opens lesson content and marks a lesson complete.                                                                     |
| Progress                | The learner sees course completion and a clear next action.                                                                               |
| Course operations       | An administrator can create, structure, publish, and maintain a course; this can ship as V1.1 if a temporary internal tool is sufficient. |

### Explicit V1 decisions

- All V1 courses are free. `price` may exist in the domain model, but payment, checkout, invoices, refunds, and promotions are out of scope.
- Enrolling grants access to every active lesson in the course. Sequential locking is not a V1 rule.
- Course completion occurs when all active lessons are completed. Quiz passing and certificates are not completion prerequisites in V1.
- A published course is immutable. An administrator must unpublish it before changing its structure or metadata.
- The frontend is Vietnamese-first. Domain values such as CEFR levels remain language-neutral.

## Not in V1

The following ideas are valid future product areas, but must not create implementation work during V1:

- placement tests, learning roadmaps, streaks, achievements, and recommendations;
- quiz delivery, attempts, scoring, and certificates;
- payments or paid enrollment;
- Explore Germany articles, search across content, travel information, or study-abroad checklists;
- user-submitted stories, comments, community, news, or legal guidance;
- email verification, social login, notifications, PWA, dark mode, and AI assistance.

Each future area needs its own product brief and vertical slice before it enters a release.

## Priorities

| Priority | Work                                                                                                                         |
| -------- | ---------------------------------------------------------------------------------------------------------------------------- |
| P0       | Course catalog/detail, authentication, enrollment, learning player, lesson completion, progress, error states, API contract. |
| P1       | Profile/settings, session management, responsive polish, an admin authoring web UI, dashboard aggregation.                   |
| P2       | Assessments, certificates, editorial content, study journeys, bookmarks, search improvements.                                |

## Success measures

These are initial hypotheses to validate, not artificial targets.

- A new learner can enroll in a first course without assistance.
- A returning learner can reach their next lesson from the learning dashboard in one clear action.
- Every API failure has an understandable UI response; no blank screen or silent failure is acceptable.
- A published course can be created and consumed end-to-end in a local environment.

## Product boundaries

`Learning` owns courses, enrollments, lessons, and learning progress. `Identity` owns users, sessions, and authorization. A future `Content` context owns editorial articles and categories. A future `Study Journey` context owns personal preparation plans; it must not be hidden inside the Account area.

## Assumptions to validate

- The primary audience wants Vietnamese UI copy and can study independently online.
- Free course enrollment is the correct first product loop.
- A course is the right first learning unit; vocabulary-only and media-only learning can wait.
- Course authorship is administrator-only in V1. If external instructors become a real business role, introduce it deliberately in V2 rather than pretending it exists now.
