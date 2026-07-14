# Wireframe Specifications

These are low-fidelity requirements for Figma or implementation sketches. They define information hierarchy and interaction zones; visual tokens belong in `08-design-system.md`.

## Shared shells

### Marketing shell

```text
Header: logo | Learn | Sign in / user menu
Main: route content
Footer: product links | legal links | contact placeholder
```

Use this shell for Home, course catalog, course detail, and authentication entry points. Keep navigation small during V1; future product areas must not appear as disabled or empty menu items.

### Learner application shell

```text
Top bar: logo | Learning | account menu
Main: page title + route content
Mobile: accessible menu button, no hidden navigation trap
```

The Learning dashboard and Course player use this shell. Settings live under the account menu rather than competing with the learning task.

### Administrator shell (V1.1)

```text
Admin header: logo | Courses | account menu
Main: administration content
```

The administrator shell is separate from learner navigation to prevent role-specific controls leaking into public pages.

## Home

```text
Hero: concise promise + “Browse courses” primary action
Trust/value row: structured courses | visible progress | learn at your pace
How it works: Discover → Enroll → Learn → Continue
Course discovery callout
Footer
```

The home page must not claim certificates, quizzes, travel guides, community, or study-abroad assistance in V1.

## Course catalog

```text
Page title and short orientation
Search input
Result summary
Course-card grid/list
Pagination
```

Each course card contains title, short description, CEFR level, estimated hours, price display, and an action to view details. At mobile width, cards become one column and search remains visible. Empty results explain how to broaden a search.

## Course detail

```text
Breadcrumb: Learn / Course title
Hero: title, level, estimate, price, enrollment action
Overview: description
Curriculum: ordered sections, lesson preview rows, free-preview cue
Enrollment reassurance / sign-in explanation
```

The page never renders `LessonResponse.content` to a public user. The call to action is context-sensitive: `Enroll`, `Sign in to enroll`, or `Continue learning`.

## Authentication

```text
Brand and purpose
Form fields with label, help text, inline error
Primary submit action
Alternative route link (login ↔ register)
Small privacy/security note
```

Keyboard focus begins at the page heading or first field. Errors are both visible and announced. The password field supports visibility toggle without changing its value. Do not expose whether an email exists beyond the agreed API error policy.

## Learning dashboard

```text
Heading: My learning
Primary panel: Continue learning (one active course and next action)
Active-course cards: progress, last activity, continue action
Completed-course section: course summary/status
Empty state: explanation + Browse courses action
```

If multiple active courses exist, rank by last progress update in V1. This is a display rule, not a recommendation engine.

## Course player

```text
Course title + completion percentage
Desktop: left curriculum navigation | right lesson content
Mobile: lesson selector button / drawer | lesson content
Lesson header: section, title, estimate
Lesson body: trusted content rendered safely
Footer action: previous | mark complete / completed | next
```

The selected lesson must have an addressable route. Completed lessons have a non-color-only indicator. While completion is pending, disable the action but do not navigate away. On course completion, show a simple completion summary and return-to-dashboard action; do not promise a certificate.

## Settings

```text
Settings side navigation on desktop; section selector on mobile
Profile: editable identity fields
Security: change password, sessions list, revoke actions, deactivate account
```

Destructive controls use a confirmation dialog with a specific explanation of the effect. The final confirmation action has the focus when appropriate, but the safe cancel action remains obvious.

## Administrator course editor (V1.1)

```text
Course metadata form + draft/published status
Section list with ordered lesson rows
Add/edit section and lesson dialogs or dedicated panels
Publish/unpublish control with eligibility feedback
```

The editor must reflect that published courses cannot be edited. It must not fake client-side eligibility; backend error messages are presented next to the relevant action.

## Responsive and state checklist

- Design at 320px, 768px, and 1280px minimum; content reflows without horizontal scrolling.
- Every page is designed in loading, empty, error, and populated states.
- Touch targets are at least 44 by 44 CSS pixels where practical.
- Dialogs, menus, and mobile navigation trap focus appropriately and return focus when closed.
- The visual wireframe link, screenshot, or Figma frame is added beside the corresponding route before implementation begins.
