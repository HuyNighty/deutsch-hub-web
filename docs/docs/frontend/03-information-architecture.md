# Information Architecture

This document owns product areas and page ownership. It is not an XML sitemap and it does not define backend endpoints.

## V1 navigation

```text
Public shell
├── Home
├── Learn
│   ├── Course catalog
│   └── Course detail (published preview)
├── Sign in
└── Create account

Authenticated learner shell
├── Learning dashboard
│   ├── Active / completed courses
│   └── Continue learning
├── Course player
│   ├── Curriculum navigation
│   ├── Lesson content
│   └── Completion state
└── Settings
    ├── Profile
    └── Security and sessions

Internal administrator shell (V1.1)
└── Course administration
    ├── Course list
    ├── Course editor
    ├── Sections and lessons
    └── Publish / unpublish
```

## Canonical ownership

| Concept | Canonical area | Rule |
| --- | --- | --- |
| Discovering a course | Learn / course catalog | Public and search-engine reachable. |
| Course curriculum preview | Course detail | Public metadata only. |
| Current enrollments and completion | Learning dashboard | The only learner-facing list of “my courses”. |
| Lesson content | Course player | Requires an active enrollment. |
| Profile and sessions | Settings | Does not repeat learning data. |
| Course composition and publishing | Administrator | Not shown in learner navigation. |

There is no separate Account page that duplicates `My Learning`; settings are personal-account concerns, while learning is a first-class application area.

## Page inventory and required states

| Page | Purpose | Required states |
| --- | --- | --- |
| Home | Explain the focused V1 offer and point to Learn. | Initial, API unavailable fallback. |
| Course catalog | Find published courses. | Loading, results, no results, pagination, request error. |
| Course detail | Evaluate a published course before enrollment. | Loading, not found, preview, enrolled CTA, request error. |
| Login / register | Establish an authenticated session. | Form validation, submitting, credentials failure, server failure. |
| Learning dashboard | Resume or review enrolled courses. | Loading, no enrollments, active/completed courses, request error. |
| Course player | Read an enrolled lesson and record completion. | Loading, access denied, no lessons, completed/incomplete lesson, mutation pending/error. |
| Profile / security | Manage personal identity and sessions. | Loading, validation, confirm destructive action, request error. |

## Future information architecture

When supported by a backend context and an approved release brief, add these independent top-level areas:

```text
Explore Germany     → editorial categories, article list, article detail
Study in Germany    → guides and a personal preparation journey
Assessments         → placement test, quiz attempts, results, certificates
```

Do not add these areas to V1 navigation merely because the long-term product vision mentions them.
