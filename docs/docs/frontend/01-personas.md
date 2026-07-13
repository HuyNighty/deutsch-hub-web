# Personas

Personas are decision tools, not fictional biographies. They are hypotheses to validate with learner interviews, usability tests, and product analytics. V1 has one primary persona so that conflicts are resolved consistently.

## Primary persona — Germany-bound learner

| Aspect | Description |
| --- | --- |
| Situation | A Vietnamese learner is preparing for study, vocational training, or work in Germany and needs structured German learning. |
| Goal | Start at an appropriate level and make visible, repeatable progress. |
| Main pain | Information is fragmented; the learner does not know which course to begin or what to do after a lesson. |
| Device and context | Often mobile first, studies in short sessions, returns after gaps. |
| V1 need | Clear course description, simple enrollment, reliable lesson access, visible progress, and an obvious next lesson. |
| Success signal | The learner returns and continues the same course without needing to search again. |
| Representative quote | “I want a clear starting point and proof that I am moving forward.” |

### Design implications

- Never require a placement test before browsing or enrollment in V1.
- Show CEFR level, effort estimate, and lesson count before enrollment.
- Put the next learning action above secondary information on the dashboard.
- Preserve progress on the server; the user may change devices.

## Secondary persona — curious visitor

| Aspect | Description |
| --- | --- |
| Situation | The visitor arrives through search, social media, or a shared course link and has not committed to learning yet. |
| Goal | Quickly judge whether a course is useful and trustworthy. |
| Main pain | They do not want to create an account before understanding the offer. |
| V1 need | Public catalog, preview curriculum, transparent level and time estimate, and a clear enrollment call to action. |
| Success signal | The visitor creates an account only after choosing a course. |

### Design implications

- Course catalog and published course detail are public.
- Do not expose full lesson content before enrollment; expose only preview metadata.
- A protected action must explain why sign-in is required and return the user to the intended course after authentication.

## Future personas, deliberately deferred

Traveler, Germany enthusiast, Germany resident, external instructor, and platform administrator are valid future personas. They must not dictate V1 learner UI until their associated product area exists. The administrator currently supports internal course operations, not public learning content.

## Persona traceability

Every V1 feature in `05-feature-specifications.md` identifies the persona it serves. If a proposed feature serves neither primary nor secondary persona, it is not V1 work.
