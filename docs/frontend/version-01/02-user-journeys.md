# User Journeys

User journeys describe a person's outcome over time. They are intentionally independent of page names and buttons. Task-level interactions belong in `04-task-flows.md`.

## Journey A — Start and sustain German learning (V1)

| Stage | User question | Product support | Successful transition |
| --- | --- | --- | --- |
| Discover | “Is there a course for me?” | Public catalog with search and CEFR level | Opens a course detail page |
| Evaluate | “What will I learn, and how much work is it?” | Curriculum preview, level, duration, lesson count | Chooses to enroll |
| Commit | “Can I begin safely?” | Account creation/sign-in and free enrollment | Has an active enrollment |
| Learn | “What should I do now?” | Course player, lesson navigation, completion action | Completes one or more lessons |
| Continue | “Where do I resume?” | Learning dashboard and progress | Opens the next appropriate lesson |
| Complete | “Did I finish this course?” | Completed status and a clear summary | Understands the course is complete |

The journey is successful when the learner can return after time away and immediately continue. It does not require certificates, quizzes, gamification, or study-abroad content to prove value.

## Journey B — Evaluate before committing (V1)

| Stage | User question | Product support | Successful transition |
| --- | --- | --- | --- |
| Arrive | “What is DeutschHub?” | Focused home page and public navigation | Visits the course catalog |
| Compare | “Which course is relevant?” | Search, level labels, and consistent course cards | Opens a relevant course |
| Trust | “Can I see the plan first?” | Published course detail and lesson-preview metadata | Starts registration or sign-in |
| Convert | “Will I lose my choice?” | Return-to behavior after authentication | Enrolls successfully |

## Future journey boundaries

Study-abroad preparation, travel planning, resident adaptation, and editorial exploration are future journeys. They will be added only with their own business context and user outcome. They are not sub-pages of the learning dashboard.

## Journey rules for implementation

- A user must always know their current course, completion state, and next meaningful action.
- Authentication is a transition, not a dead end: preserve the intended protected action and return after success.
- The learner's server-side enrollment is the source of truth for access and completion.
- A journey stage is never represented by a frontend-only business status when the backend owns it.
